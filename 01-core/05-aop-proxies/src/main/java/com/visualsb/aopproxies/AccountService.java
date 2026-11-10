package com.visualsb.aopproxies;

public interface AccountService {

    String transfer(String from, String to);

    String failingOperation();

    String selfCallDemo();
}
