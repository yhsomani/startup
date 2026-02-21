/**
 * Secure Query Builder for TalentSphere Platform
 *
 * Prevents SQL injection attacks through parameterized queries and input validation
 */

const { createLogger } = require("../../shared/enhanced-logger");

class SecureQueryBuilder {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.logger = createLogger("SecureQueryBuilder");

        // Query components
        this._select = [];
        this._from = null;
        this._joins = [];
        this._where = [];
        this._groupBy = [];
        this._having = [];
        this._orderBy = [];
        this._limit = null;
        this._offset = null;
        this._params = [];

        // SQL injection protection patterns
        this.dangerousPatterns = [
            /(\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|UNION|SELECT)\b)/i,
            /(;\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|UNION|SELECT)\b)/i,
            /(--|#|\/\*|\*\/)/,
            /(\bOR\b.*\b1\b.*=\b1\b)/i,
            /(\bAND\b.*\b1\b.*=\b1\b)/i,
            /('.*OR.*'.*=.*'.*')/i,
            /('.*AND.*'.*=.*'.*')/i,
        ];

        // Allowed column patterns (whitelist)
        this.allowedColumnPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
        this.allowedTablePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    }

    /**
     * Validate table name against whitelist
     */
    validateTable(tableName) {
        if (!this.allowedTablePattern.test(tableName)) {
            throw new Error(`Invalid table name: ${tableName}`);
        }
        return tableName;
    }

    /**
     * Validate column name against whitelist
     */
    validateColumn(columnName) {
        if (!this.allowedColumnPattern.test(columnName)) {
            throw new Error(`Invalid column name: ${columnName}`);
        }
        return columnName;
    }

    /**
     * Detect SQL injection attempts
     */
    detectSQLInjection(input) {
        if (typeof input !== "string") {
            return false;
        }

        for (const pattern of this.dangerousPatterns) {
            if (pattern.test(input)) {
                this.logger.warn("SQL injection attempt detected", {
                    input: input.substring(0, 100),
                    pattern: pattern.toString(),
                });
                return true;
            }
        }

        return false;
    }

    /**
     * Sanitize input for safe SQL usage
     */
    sanitizeInput(input) {
        if (typeof input !== "string") {
            return input;
        }

        if (this.detectSQLInjection(input)) {
            throw new Error("SQL injection attempt detected");
        }

        // Additional sanitization
        return input
            .replace(/['"\\]/g, "") // Remove quotes and backslashes
            .replace(/;/g, "") // Remove semicolons
            .replace(/--/g, "") // Remove SQL comments
            .replace(/\/\*/g, "") // Remove block comment start
            .replace(/\*\//g, ""); // Remove block comment end
    }

    /**
     * SELECT clause
     */
    select(columns = ["*"]) {
        if (typeof columns === "string") {
            columns = [columns];
        }

        this._select = columns.map(col => {
            if (col === "*") return "*";

            // Handle functions like COUNT(*), MAX(id), etc.
            if (col.includes("(") && col.includes(")")) {
                const match = col.match(/^([A-Z_]+)\((.*)\)$/i);
                if (match) {
                    const [, func, arg] = match;
                    if (arg === "*") return `${func.toUpperCase()}(*)`;
                    return `${func.toUpperCase()}(${this.validateColumn(arg)})`;
                }
            }

            // Handle aliases
            if (col.includes(" AS ")) {
                const [actualColumn, alias] = col.split(" AS ");
                return `${this.validateColumn(actualColumn)} AS ${this.validateColumn(alias)}`;
            }

            return this.validateColumn(col);
        });

        return this;
    }

    /**
     * FROM clause
     */
    from(table) {
        this._from = this.validateTable(table);
        return this;
    }

    /**
     * JOIN clause
     */
    join(table, onCondition, joinType = "INNER") {
        const validJoinTypes = ["INNER", "LEFT", "RIGHT", "FULL", "CROSS"];
        if (!validJoinTypes.includes(joinType.toUpperCase())) {
            throw new Error(`Invalid join type: ${joinType}`);
        }

        this._joins.push({
            type: joinType.toUpperCase(),
            table: this.validateTable(table),
            on: this.buildJoinCondition(onCondition),
        });

        return this;
    }

    /**
     * Build join condition safely
     */
    buildJoinCondition(condition) {
        if (typeof condition === "string") {
            // Simple table.column = table.column format
            const matches = condition.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/g);
            if (matches && matches.length === 2) {
                return condition; // Safe table.column format
            }
            throw new Error(`Invalid join condition: ${condition}`);
        }

        if (typeof condition === "object" && condition.left && condition.right) {
            return `${this.validateColumn(condition.left.table)}.${this.validateColumn(condition.left.column)} = ${this.validateColumn(condition.right.table)}.${this.validateColumn(condition.right.column)}`;
        }

        throw new Error("Join condition must be a string or object with left and right properties");
    }

    /**
     * WHERE clause with parameterized values
     */
    where(column, operator = "=", value) {
        this.validateColumn(column);

        // Validate operator
        const validOperators = [
            "=",
            "!=",
            "<>",
            ">",
            "<",
            ">=",
            "<=",
            "LIKE",
            "ILIKE",
            "IN",
            "NOT IN",
            "IS NULL",
            "IS NOT NULL",
        ];
        const normalizedOperator = operator.toUpperCase().replace("!<>", "!=");

        if (!validOperators.includes(normalizedOperator)) {
            throw new Error(`Invalid operator: ${operator}`);
        }

        // Handle different operators
        switch (normalizedOperator) {
            case "IN":
            case "NOT IN":
                if (!Array.isArray(value)) {
                    throw new Error(`IN operator requires array value`);
                }
                const placeholders = value.map(() => "?").join(", ");
                this._where.push(`${column} ${normalizedOperator} (${placeholders})`);
                this._params.push(...value);
                break;

            case "IS NULL":
            case "IS NOT NULL":
                this._where.push(`${column} ${normalizedOperator}`);
                break;

            case "LIKE":
            case "ILIKE":
                if (typeof value !== "string") {
                    throw new Error(`LIKE operator requires string value`);
                }
                this._where.push(`${column} ${normalizedOperator} ?`);
                this._params.push(value);
                break;

            default:
                this._where.push(`${column} ${operator} ?`);
                this._params.push(value);
                break;
        }

        return this;
    }

    /**
     * WHERE clause with AND logic
     */
    andWhere(column, operator = "=", value) {
        return this.where(column, operator, value);
    }

    /**
     * WHERE clause with OR logic
     */
    orWhere(column, operator = "=", value) {
        this.validateColumn(column);

        const validOperators = [
            "=",
            "!=",
            "<>",
            ">",
            "<",
            ">=",
            "<=",
            "LIKE",
            "ILIKE",
            "IN",
            "NOT IN",
            "IS NULL",
            "IS NOT NULL",
        ];
        const normalizedOperator = operator.toUpperCase().replace("!<>", "!=");

        if (!validOperators.includes(normalizedOperator)) {
            throw new Error(`Invalid operator: ${operator}`);
        }

        // Build OR condition
        let condition;
        switch (normalizedOperator) {
            case "IN":
            case "NOT IN":
                if (!Array.isArray(value)) {
                    throw new Error(`IN operator requires array value`);
                }
                const placeholders = value.map(() => "?").join(", ");
                condition = `${column} ${normalizedOperator} (${placeholders})`;
                this._params.push(...value);
                break;

            case "IS NULL":
            case "IS NOT NULL":
                condition = `${column} ${normalizedOperator}`;
                break;

            case "LIKE":
            case "ILIKE":
                if (typeof value !== "string") {
                    throw new Error(`LIKE operator requires string value`);
                }
                condition = `${column} ${normalizedOperator} ?`;
                this._params.push(value);
                break;

            default:
                condition = `${column} ${operator} ?`;
                this._params.push(value);
                break;
        }

        if (this._where.length > 0) {
            this._where[this._where.length - 1] += ` OR ${condition}`;
        } else {
            this._where.push(condition);
        }

        return this;
    }

    /**
     * WHERE clause with multiple conditions (AND)
     */
    whereMultiple(conditions) {
        if (!Array.isArray(conditions)) {
            throw new Error("Conditions must be an array");
        }

        conditions.forEach(condition => {
            if (!condition.column || !condition.operator || condition.value === undefined) {
                throw new Error("Each condition must have column, operator, and value");
            }

            this.where(condition.column, condition.operator, condition.value);
        });

        return this;
    }

    /**
     * GROUP BY clause
     */
    groupBy(columns) {
        if (typeof columns === "string") {
            columns = [columns];
        }

        this._groupBy = columns.map(col => this.validateColumn(col));
        return this;
    }

    /**
     * HAVING clause
     */
    having(column, operator = "=", value) {
        this.validateColumn(column);

        const validOperators = ["=", "!=", "<>", ">", "<", ">=", "<=", "LIKE", "ILIKE"];
        if (!validOperators.includes(operator)) {
            throw new Error(`Invalid operator: ${operator}`);
        }

        this._having.push(`${column} ${operator} ?`);
        this._params.push(value);

        return this;
    }

    /**
     * ORDER BY clause
     */
    orderBy(column, direction = "ASC") {
        this.validateColumn(column);

        const validDirections = ["ASC", "DESC"];
        const normalizedDirection = direction.toUpperCase();

        if (!validDirections.includes(normalizedDirection)) {
            throw new Error(`Invalid order direction: ${direction}`);
        }

        this._orderBy.push(`${column} ${normalizedDirection}`);
        return this;
    }

    /**
     * LIMIT clause
     */
    limit(count) {
        if (!Number.isInteger(count) || count < 1 || count > 10000) {
            throw new Error("Limit must be a positive integer not exceeding 10000");
        }

        this._limit = count;
        return this;
    }

    /**
     * OFFSET clause
     */
    offset(count) {
        if (!Number.isInteger(count) || count < 0) {
            throw new Error("Offset must be a non-negative integer");
        }

        this._offset = count;
        return this;
    }

    /**
     * Build the final SQL query
     */
    build() {
        if (!this._from) {
            throw new Error("FROM clause is required");
        }

        let query = "";
        const params = [...this._params];

        // SELECT clause
        query += `SELECT ${this._select.join(", ")} `;

        // FROM clause
        query += `FROM ${this._from} `;

        // JOIN clauses
        for (const join of this._joins) {
            query += `${join.type} JOIN ${join.table} ON ${join.on} `;
        }

        // WHERE clause
        if (this._where.length > 0) {
            query += `WHERE ${this._where.join(" AND ")} `;
        }

        // GROUP BY clause
        if (this._groupBy.length > 0) {
            query += `GROUP BY ${this._groupBy.join(", ")} `;
        }

        // HAVING clause
        if (this._having.length > 0) {
            query += `HAVING ${this._having.join(" AND ")} `;
        }

        // ORDER BY clause
        if (this._orderBy.length > 0) {
            query += `ORDER BY ${this._orderBy.join(", ")} `;
        }

        // LIMIT clause
        if (this._limit !== null) {
            query += `LIMIT ${this._limit} `;
            params.push(this._limit);
        }

        // OFFSET clause
        if (this._offset !== null) {
            query += `OFFSET ${this._offset} `;
            params.push(this._offset);
        }

        return {
            query: query.trim(),
            params,
        };
    }

    /**
     * Execute the query
     */
    async execute() {
        const { query, params } = this.build();

        this.logger.debug("Executing secure query", {
            query: query.substring(0, 200) + (query.length > 200 ? "..." : ""),
            paramCount: params.length,
        });

        try {
            const result = await this.db.query(query, params);
            this.logger.debug("Query executed successfully", {
                rowCount: result.rowCount,
            });
            return result;
        } catch (error) {
            this.logger.error("Query execution failed", {
                error: error.message,
                query: query.substring(0, 200),
                paramCount: params.length,
            });
            throw error;
        }
    }

    /**
     * Get first row
     */
    async first() {
        this.limit(1);
        const result = await this.execute();
        return result.rows[0] || null;
    }

    /**
     * Get all rows
     */
    async get() {
        const result = await this.execute();
        return result.rows;
    }

    /**
     * Count rows
     */
    async count() {
        const originalSelect = [...this._select];
        this._select = ["COUNT(*) as count"];

        const { query, params } = this.build();
        const result = await this.db.query(query, params);

        // Restore original select
        this._select = originalSelect;

        return parseInt(result.rows[0].count);
    }

    /**
     * Reset the query builder
     */
    reset() {
        this._select = [];
        this._from = null;
        this._joins = [];
        this._where = [];
        this._groupBy = [];
        this._having = [];
        this._orderBy = [];
        this._limit = null;
        this._offset = null;
        this._params = [];

        return this;
    }

    /**
     * Static method to create a new query builder
     */
    static create(databaseManager) {
        return new SecureQueryBuilder(databaseManager);
    }
}

module.exports = SecureQueryBuilder;
