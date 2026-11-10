package com.visualsb.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(1)
class TraceFilter extends OncePerRequestFilter {

    private final RequestTrace trace;

    TraceFilter(RequestTrace trace) {
        this.trace = trace;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        trace.record("1. filter.before");
        try {
            chain.doFilter(request, response);
        } finally {
            trace.record("6. filter.after");
        }
    }
}
