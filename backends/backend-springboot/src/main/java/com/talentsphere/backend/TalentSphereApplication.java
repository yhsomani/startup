package com.talentsphere.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class TalentSphereApplication {

	public static void main(String[] args) {
		SpringApplication.run(TalentSphereApplication.class, args);
	}

}
