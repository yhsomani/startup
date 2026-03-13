package com.talentsphere.company.repository;

import com.talentsphere.company.entity.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {

    Page<Company> findByActiveTrue(Pageable pageable);

    Page<Company> findByIndustry(String industry, Pageable pageable);

    Page<Company> findByVerifiedTrue(Pageable pageable);

    Page<Company> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
