package com.visualsb.security;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
class DemoController {

    @GetMapping("/public")
    Map<String, String> publicEndpoint() {
        return Map.of("message", "публичный ответ");
    }

    @GetMapping("/private")
    Map<String, String> privateEndpoint(Authentication authentication) {
        return Map.of("message", "доступ разрешён", "user", authentication.getName());
    }
}
