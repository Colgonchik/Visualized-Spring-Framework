package com.visualsb.beandefinition.service;

import java.time.LocalTime;

public class TimeProvider {

    public String now() {
        return LocalTime.now().toString();
    }
}
