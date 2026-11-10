package com.visualsb.aopproxies;

import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class AopProxiesApplicationTests {

    @Autowired
    private AccountService accountService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private LoggingTransactionManager txManager;

    @Test
    void interfaceBeanGetsJdkProxyAndClassOnlyBeanGetsCglib() {
        assertThat(AopUtils.isJdkDynamicProxy(accountService)).isTrue();
        assertThat(AopUtils.isCglibProxy(accountService)).isFalse();
        assertThat(AopUtils.isCglibProxy(reportService)).isTrue();
    }

    @Test
    void successfulTransactionalMethodCommits() {
        txManager.clear();
        assertThat(accountService.transfer("a", "b")).isEqualTo("перевод a -> b выполнен");
        assertThat(txManager.events()).containsExactly("begin", "commit");
    }

    @Test
    void exceptionInsideTransactionalMethodRollsBack() {
        txManager.clear();
        assertThatThrownBy(accountService::failingOperation).isInstanceOf(IllegalStateException.class);
        assertThat(txManager.events()).containsExactly("begin", "rollback");
    }

    @Test
    void selfInvocationBypassesProxyAndStartsNoTransaction() {
        txManager.clear();
        assertThat(accountService.selfCallDemo()).isEqualTo("перевод a -> b выполнен");
        assertThat(txManager.events()).isEmpty();
    }
}
