package com.visualsb.componentscan;

import com.visualsb.componentscan.component.NamedComponent;
import com.visualsb.componentscan.component.PlainComponent;
import com.visualsb.componentscan.excluded.InternalComponent;
import com.visualsb.componentscan.repository.NotificationRepository;
import com.visualsb.componentscan.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ComponentScanApplicationTests {

    @Autowired
    private ApplicationContext context;

    @Test
    void scansStereotypeAnnotationsIncludingMetaAnnotations() {
        assertThat(context.getBean(PlainComponent.class)).isNotNull();
        assertThat(context.getBean(NotificationService.class)).isNotNull();
        assertThat(context.getBean(NotificationRepository.class)).isNotNull();
    }

    @Test
    void beanNamesDefaultToDecapitalizedClassName() {
        assertThat(context.containsBean("plainComponent")).isTrue();
        assertThat(context.containsBean("notificationService")).isTrue();
    }

    @Test
    void explicitBeanNameOverridesDefault() {
        assertThat(context.containsBean("renamedComponent")).isTrue();
        assertThat(context.containsBean("namedComponent")).isFalse();
    }

    @Test
    void excludeFilterSkipsPackage() {
        assertThat(context.containsBean("internalComponent")).isFalse();
        assertThat(context.getBeanNamesForType(InternalComponent.class)).isEmpty();
    }
}
