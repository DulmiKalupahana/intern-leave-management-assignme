package com.example.leave.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordHasherTest {

    @Test
    void hash_thenMatches_returnsTrue() {
        String hash = PasswordHasher.hash("correct horse battery staple");

        assertTrue(PasswordHasher.matches("correct horse battery staple", hash));
        assertFalse(PasswordHasher.matches("wrong password", hash));
    }

    @Test
    void hashes_areSaltedAndNotReversible() {
        String first = PasswordHasher.hash("same-password");
        String second = PasswordHasher.hash("same-password");

        assertNotEquals(first, second);
        assertTrue(first.startsWith("pbkdf2$"));
        assertFalse(first.contains("same-password"));
    }

    @Test
    void matches_malformedHash_returnsFalse() {
        assertFalse(PasswordHasher.matches("anything", "not-a-hash"));
        assertFalse(PasswordHasher.matches("anything", null));
        assertFalse(PasswordHasher.matches(null, PasswordHasher.hash("x")));
    }
}
