#!/usr/bin/env node

const CachingService = require('./caching-service');
const axios = require('axios');
require('dotenv').config();

/**
 * Cache Warming Script
 * Pre-populates cache with frequently accessed data
 */

class CacheWarmer {
    constructor() {
        this.cache = new CachingService();
        this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        this.warmedKeys = [];
        this.failedKeys = [];
    }

    async initialize() {
        const connected = await this.cache.connect();
        if (!connected) {
            console.error('❌ Failed to connect to cache service');
            process.exit(1);
        }
        console.log('✅ Cache service connected');
    }

    async warmPopularJobs() {
        console.log('🔥 Warming popular jobs cache...');

        try {
            // Get popular jobs (most viewed/appied)
            const response = await axios.get(`${this.baseUrl}/api/jobs/popular?limit=50`);
            const jobs = response.data.jobs || response.data;

            for (const job of jobs) {
                const key = `job:${job.id}`;
                await this.cache.set(key, job, 3600); // 1 hour TTL

                // Also cache job lists by common filters
                const filters = [
                    { location: job.location },
                    { company_id: job.company_id },
                    { employment_type: job.employment_type }
                ];

                for (const filter of filters) {
                    const filterKey = `jobs:list:${JSON.stringify(filter)}`;
                    const listData = { jobs: [job], totalCount: 1, timestamp: Date.now() };
                    await this.cache.set(filterKey, listData, 1800); // 30 minutes
                }

                this.warmedKeys.push(key);
            }

            console.log(`✅ Warmed ${jobs.length} popular jobs`);
            return jobs.length;
        } catch (error) {
            console.error('❌ Failed to warm popular jobs:', error.message);
            this.failedKeys.push('popular-jobs');
            return 0;
        }
    }

    async warmActiveCompanies() {
        console.log('🔥 Warming active companies cache...');

        try {
            const response = await axios.get(`${this.baseUrl}/api/companies/active?limit=100`);
            const companies = response.data.companies || response.data;

            for (const company of companies) {
                const key = `company:${company.id}`;
                await this.cache.set(key, company, 7200); // 2 hours TTL

                // Cache company job counts
                const statsKey = `company-stats:${company.id}`;
                const stats = {
                    totalJobs: company.job_count || 0,
                    activeJobs: company.active_job_count || 0,
                    applications: company.application_count || 0
                };
                await this.cache.set(statsKey, stats, 3600);

                this.warmedKeys.push(key, statsKey);
            }

            console.log(`✅ Warmed ${companies.length} active companies`);
            return companies.length;
        } catch (error) {
            console.error('❌ Failed to warm active companies:', error.message);
            this.failedKeys.push('active-companies');
            return 0;
        }
    }

    async warmUserProfiles() {
        console.log('🔥 Warming user profiles cache...');

        try {
            // This would typically be done for admin users or recently active users
            const response = await axios.get(`${this.baseUrl}/api/users/recent?limit=200`);
            const users = response.data.users || response.data;

            for (const user of users) {
                const userKey = `user:${user.id}`;
                await this.cache.set(userKey, user, 3600); // 1 hour

                // Cache user profile if exists
                if (user.profile) {
                    const profileKey = `profile:${user.id}`;
                    await this.cache.set(profileKey, user.profile, 7200); // 2 hours
                    this.warmedKeys.push(profileKey);
                }

                this.warmedKeys.push(userKey);
            }

            console.log(`✅ Warmed ${users.length} user profiles`);
            return users.length;
        } catch (error) {
            console.error('❌ Failed to warm user profiles:', error.message);
            this.failedKeys.push('user-profiles');
            return 0;
        }
    }

    async warmSearchSuggestions() {
        console.log('🔥 Warming search suggestions cache...');

        const commonSearches = [
            'software engineer',
            'data scientist',
            'product manager',
            'designer',
            'marketing',
            'sales',
            'remote',
            'full stack',
            'javascript',
            'python'
        ];

        try {
            for (const searchTerm of commonSearches) {
                // Warm search results for common terms
                const searchKey = `search:suggestions:${searchTerm}`;
                const suggestions = await this.generateSearchSuggestions(searchTerm);
                await this.cache.set(searchKey, suggestions, 3600); // 1 hour

                // Warm autocomplete for the term
                const autoCompleteKey = `autocomplete:${searchTerm}`;
                const autoComplete = await this.generateAutocomplete(searchTerm);
                await this.cache.set(autoCompleteKey, autoComplete, 1800); // 30 minutes

                this.warmedKeys.push(searchKey, autoCompleteKey);
            }

            console.log(`✅ Warmed search suggestions for ${commonSearches.length} terms`);
            return commonSearches.length;
        } catch (error) {
            console.error('❌ Failed to warm search suggestions:', error.message);
            this.failedKeys.push('search-suggestions');
            return 0;
        }
    }

    async warmStaticContent() {
        console.log('🔥 Warming static content cache...');

        const staticEndpoints = [
            '/api/categories',
            '/api/skills',
            '/api/industries',
            '/api/locations'
        ];

        try {
            for (const endpoint of staticEndpoints) {
                const response = await axios.get(`${this.baseUrl}${endpoint}`);
                const key = `static:${endpoint.replace('/api/', '')}`;
                await this.cache.set(key, response.data, 86400); // 24 hours
                this.warmedKeys.push(key);
            }

            console.log(`✅ Warmed ${staticEndpoints.length} static content items`);
            return staticEndpoints.length;
        } catch (error) {
            console.error('❌ Failed to warm static content:', error.message);
            this.failedKeys.push('static-content');
            return 0;
        }
    }

    async warmHomepageData() {
        console.log('🔥 Warming homepage data cache...');

        try {
            // Featured jobs
            const featuredResponse = await axios.get(`${this.baseUrl}/api/jobs/featured?limit=10`);
            await this.cache.set('homepage:featured-jobs', featuredResponse.data, 3600);
            this.warmedKeys.push('homepage:featured-jobs');

            // Recent jobs
            const recentResponse = await axios.get(`${this.baseUrl}/api/jobs/recent?limit=20`);
            await this.cache.set('homepage:recent-jobs', recentResponse.data, 1800);
            this.warmedKeys.push('homepage:recent-jobs');

            // Statistics
            const statsResponse = await axios.get(`${this.baseUrl}/api/stats/homepage`);
            await this.cache.set('homepage:stats', statsResponse.data, 3600);
            this.warmedKeys.push('homepage:stats');

            console.log('✅ Warmed homepage data');
            return 3;
        } catch (error) {
            console.error('❌ Failed to warm homepage data:', error.message);
            this.failedKeys.push('homepage-data');
            return 0;
        }
    }

    async generateSearchSuggestions(term) {
        // Mock suggestion generation - in real implementation, this would call the search service
        return {
            term,
            suggestions: [
                `${term} jobs`,
                `${term} developer`,
                `${term} engineer`,
                `senior ${term}`,
                `junior ${term}`
            ],
            timestamp: Date.now()
        };
    }

    async generateAutocomplete(term) {
        // Mock autocomplete generation
        return {
            term,
            completions: [
                term,
                `${term} developer`,
                `${term} engineer`,
                `${term} specialist`
            ],
            timestamp: Date.now()
        };
    }

    async getCacheStats() {
        try {
            const stats = await this.cache.getStats();
            return stats;
        } catch (error) {
            console.error('Failed to get cache stats:', error);
            return null;
        }
    }

    async generateReport() {
        const cacheStats = await this.getCacheStats();

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalWarmed: this.warmedKeys.length,
                totalFailed: this.failedKeys.length,
                successRate: this.warmedKeys.length / (this.warmedKeys.length + this.failedKeys.length) * 100
            },
            warmedKeys: this.warmedKeys,
            failedKeys: this.failedKeys,
            cacheStats: cacheStats,
            details: {
                popularJobs: this.warmedKeys.filter(k => k.startsWith('job:')).length,
                companies: this.warmedKeys.filter(k => k.startsWith('company:')).length,
                users: this.warmedKeys.filter(k => k.startsWith('user:')).length,
                search: this.warmedKeys.filter(k => k.includes('search')).length,
                static: this.warmedKeys.filter(k => k.startsWith('static:')).length
            }
        };

        return report;
    }

    async saveReport(report) {
        const fs = require('fs').promises;
        const path = require('path');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `cache-warming-report-${timestamp}.json`;
        const filepath = path.join(__dirname, filename);

        try {
            await fs.writeFile(filepath, JSON.stringify(report, null, 2));
            console.log(`📋 Report saved to: ${filepath}`);
            return filepath;
        } catch (error) {
            console.error('Failed to save report:', error);
            return null;
        }
    }

    async runFullWarming() {
        console.log('=== Starting Cache Warming Process ===');

        await this.initialize();

        try {
            // Run all warming functions
            const jobsWarmed = await this.warmPopularJobs();
            const companiesWarmed = await this.warmActiveCompanies();
            const usersWarmed = await this.warmUserProfiles();
            const searchWarmed = await this.warmSearchSuggestions();
            const staticWarmed = await this.warmStaticContent();
            const homepageWarmed = await this.warmHomepageData();

            // Generate and save report
            const report = await this.generateReport();
            const reportPath = await this.saveReport(report);

            console.log('\n=== Cache Warming Complete ===');
            console.log(`📊 Summary:`);
            console.log(`   • Popular Jobs: ${jobsWarmed}`);
            console.log(`   • Active Companies: ${companiesWarmed}`);
            console.log(`   • User Profiles: ${usersWarmed}`);
            console.log(`   • Search Suggestions: ${searchWarmed}`);
            console.log(`   • Static Content: ${staticWarmed}`);
            console.log(`   • Homepage Data: ${homepageWarmed}`);
            console.log(`   • Total Keys Warmed: ${report.summary.totalWarmed}`);
            console.log(`   • Success Rate: ${report.summary.successRate.toFixed(1)}%`);
            console.log(`   • Report: ${reportPath || 'N/A'}`);

            if (report.cacheStats) {
                console.log(`\n📈 Cache Stats:`);
                console.log(`   • Hit Rate: ${report.cacheStats.redis?.hit_rate || 'N/A'}%`);
                console.log(`   • Memory Usage: ${report.cacheStats.redis?.used_memory || 'N/A'}`);
                console.log(`   • Connected Clients: ${report.cacheStats.redis?.connected_clients || 'N/A'}`);
            }

        } catch (error) {
            console.error('Cache warming failed:', error);
        } finally {
            await this.cache.cleanup();
        }
    }
}

// Run if executed directly
if (require.main === module) {
    const warmer = new CacheWarmer();
    warmer.runFullWarming().catch(console.error);
}

module.exports = CacheWarmer;