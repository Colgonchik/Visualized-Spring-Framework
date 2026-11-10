package com.visualsb.aopproxies;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    @Transactional
    public String generate() {
        return "отчёт готов";
    }
}
