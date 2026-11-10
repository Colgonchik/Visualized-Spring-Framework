package com.visualsb.data;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoteService {

    private final NoteRepository repository;

    public NoteService(NoteRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Note save(String text) {
        return repository.save(new Note(text));
    }

    @Transactional
    public void saveThenFail(String text) {
        repository.save(new Note(text));
        repository.flush();
        throw new IllegalStateException("Демонстрационная ошибка: транзакция будет откачена");
    }
}
