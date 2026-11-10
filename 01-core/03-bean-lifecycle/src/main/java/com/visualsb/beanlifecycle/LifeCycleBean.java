package com.visualsb.beanlifecycle;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.BeanNameAware;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;

public class LifeCycleBean implements BeanNameAware, InitializingBean, DisposableBean {

    private final LifecycleLog log;
    private Collaborator collaborator;
    private String beanName;

    public LifeCycleBean(LifecycleLog log) {
        this.log = log;
        event("constructor", "1. Конструктор: экземпляр создан (instantiate)");
    }

    @Autowired
    public void setCollaborator(Collaborator collaborator) {
        this.collaborator = collaborator;
        event("populate", "2. Сеттер-инъекция: зависимости внедрены (populate)");
    }

    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        event("beanNameAware", "3. BeanNameAware: бин узнал своё имя '" + name + "'");
    }

    @PostConstruct
    public void postConstruct() {
        event("postConstruct", "5. @PostConstruct");
    }

    @Override
    public void afterPropertiesSet() {
        event("afterPropertiesSet", "6. InitializingBean#afterPropertiesSet");
    }

    public void customInit() {
        event("customInit", "7. customInit: initMethod из @Bean");
    }

    @PreDestroy
    public void preDestroy() {
        event("preDestroy", "9. @PreDestroy: контекст закрывается");
    }

    @Override
    public void destroy() {
        event("destroy", "10. DisposableBean#destroy");
    }

    public void customDestroy() {
        event("customDestroy", "11. customDestroy: destroyMethod из @Bean");
    }

    public String hello() {
        return "бин '" + beanName + "' готов, collaborator = "
                + collaborator.getClass().getSimpleName();
    }

    private void event(String key, String text) {
        log.add(key);
        System.out.println(">>> " + text);
    }
}
