package com.fitsense.backend.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AiClientService {

    @Value("${app.aiBaseUrl}")
    private String aiBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> post(String endpoint, Map<String, Object> payload) {
        try {
            String url = aiBaseUrl + endpoint;

            System.out.println("Calling AI URL: " + url);
            System.out.println("Payload: " + payload);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    url,
                    payload,
                    Map.class
            );

            if (response.getBody() == null) {
                throw new RuntimeException("AI returned empty response");
            }

            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI Service call failed: " + e.getMessage());
        }
    }
}