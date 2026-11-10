package com.visualsb.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FilterChainApplicationTests {

    @Autowired
    private MockMvc mvc;

    @Test
    void publicEndpointNeedsNoAuthentication() throws Exception {
        mvc.perform(get("/public"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Visual-SB", "security-chain"))
                .andExpect(jsonPath("$.message").value("публичный ответ"));
    }

    @Test
    void privateEndpointWithoutCredentialsReturns401() throws Exception {
        mvc.perform(get("/private"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("X-Visual-SB", "security-chain"));
    }

    @Test
    void basicAuthenticationReachesController() throws Exception {
        mvc.perform(get("/private").with(httpBasic("user", "pass")))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Visual-SB", "security-chain"))
                .andExpect(jsonPath("$.message").value("доступ разрешён"))
                .andExpect(jsonPath("$.user").value("user"));
    }

    @Test
    void wrongPasswordIsRejected() throws Exception {
        mvc.perform(get("/private").with(httpBasic("user", "wrong")))
                .andExpect(status().isUnauthorized());
    }
}
