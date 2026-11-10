package com.visualsb.beanpostprocessor;

import java.lang.reflect.Proxy;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

@Component
public class LoggingPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        Class<?> beanClass = bean.getClass();
        if (!beanClass.isAnnotationPresent(Logged.class) || beanClass.getInterfaces().length == 0) {
            return bean;
        }
        System.out.println(">>> [bpp] бин '" + beanName + "' помечен @Logged — "
                + "возвращаю JDK-прокси вместо исходного объекта");
        return Proxy.newProxyInstance(
                beanClass.getClassLoader(),
                beanClass.getInterfaces(),
                new LoggingInvocationHandler(bean));
    }
}
