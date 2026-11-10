package com.visualsb.conditionsreport;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ConditionsReportApplicationTests {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void conditionsReportExplainsPositiveAndNegativeMatches() {
        ResponseEntity<JsonNode> response = rest.getForEntity("/actuator/conditions", JsonNode.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode conditions = onlyContext(response.getBody());
        assertThat(conditions.path("positiveMatches").has("WebMvcAutoConfiguration")).isTrue();
        assertThat(conditions.path("negativeMatches").has("ReportConfiguration#detailedReportService")).isTrue();
    }

    @Test
    void beansReportShowsActualDefinitions() {
        JsonNode beans = onlyContext(rest.getForObject("/actuator/beans", JsonNode.class)).path("beans");

        assertThat(beans.has("reportService")).isTrue();
        assertThat(beans.has("detailedReportService")).isFalse();
    }

    @Test
    void healthEndpointIsAvailable() {
        ResponseEntity<JsonNode> response = rest.getForEntity("/actuator/health", JsonNode.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().path("status").asText()).isEqualTo("UP");
    }

    private static JsonNode onlyContext(JsonNode root) {
        assertThat(root.path("contexts").size()).isEqualTo(1);
        return root.path("contexts").elements().next();
    }
}
