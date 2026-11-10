package com.visualsb.web;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DispatcherServletApplicationTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private RequestTrace trace;

    @BeforeEach
    void clearTrace() {
        trace.clear();
    }

    @Test
    void controllerArgumentIsBoundAndRecordBecomesJson() throws Exception {
        mvc.perform(get("/api/hello").param("name", "Visual SB"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.message").value("Привет, Visual SB!"));
    }

    @Test
    void filterInterceptorAndControllerRunInOrder() throws Exception {
        mvc.perform(get("/api/hello")).andExpect(status().isOk());

        assertThat(trace.entries()).containsExactly(
                "1. filter.before",
                "2. interceptor.preHandle",
                "3. controller",
                "4. interceptor.postHandle",
                "5. interceptor.afterCompletion",
                "6. filter.after");
    }

    @Test
    void unknownPathReturns404() throws Exception {
        mvc.perform(get("/api/missing")).andExpect(status().isNotFound());
    }
}
