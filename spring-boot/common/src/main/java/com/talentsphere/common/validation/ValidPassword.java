package com.talentsphere.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ValidPasswordValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {
    String message() default "Password must be at least 8 characters, contain uppercase, lowercase, number and special character";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
