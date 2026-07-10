package com.jledger.finance.service.wallet;

import com.jledger.finance.domain.entity.LinkedBankAccount;
import com.jledger.finance.exception.ResourceNotFoundException;
import com.jledger.finance.repository.wallet.LinkedBankAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class LinkedBankAccountService {

    private final LinkedBankAccountRepository linkedBankAccountRepository;

    public List<LinkedBankAccount> listLinkedBankAccounts(String userId) {
        ensureDefaultLinkedBankAccountExists(userId);
        return linkedBankAccountRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId);
    }

    @Transactional
    public LinkedBankAccount createLinkedBankAccount(
            String userId,
            String bankCode,
            String bankName,
            String accountNumber,
            String accountName,
            String accountType,
            boolean isDefault,
            boolean isVerified
    ) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (bankCode == null || bankCode.isBlank()) {
            throw new IllegalArgumentException("bankCode is required");
        }
        if (bankName == null || bankName.isBlank()) {
            throw new IllegalArgumentException("bankName is required");
        }
        if (accountNumber == null || accountNumber.isBlank()) {
            throw new IllegalArgumentException("accountNumber is required");
        }
        if (accountName == null || accountName.isBlank()) {
            throw new IllegalArgumentException("accountName is required");
        }

        LinkedBankAccount linkedBankAccount = new LinkedBankAccount();
        linkedBankAccount.setUserId(userId);
        linkedBankAccount.setBankCode(bankCode);
        linkedBankAccount.setBankName(bankName);
        linkedBankAccount.setAccountNumber(accountNumber);
        linkedBankAccount.setAccountName(accountName);
        linkedBankAccount.setAccountType((accountType == null || accountType.isBlank()) ? "SAVINGS" : accountType);
        linkedBankAccount.setIsDefault(isDefault);
        linkedBankAccount.setIsVerified(isVerified);

        LinkedBankAccount saved = linkedBankAccountRepository.save(linkedBankAccount);
        if (Boolean.TRUE.equals(saved.getIsDefault())) {
            normalizeDefaultAccount(userId, saved.getId());
        }
        return saved;
    }

    public LinkedBankAccount findOwnedLinkedBankAccount(String userId, Long bankAccountId) {
        if (bankAccountId == null) {
            throw new IllegalArgumentException("bankAccountId is required");
        }
        return linkedBankAccountRepository.findByIdAndUserId(Objects.requireNonNull(bankAccountId), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found"));
    }

    @Transactional
    public LinkedBankAccount setDefaultLinkedBankAccount(String userId, Long bankAccountId) {
        LinkedBankAccount target = findOwnedLinkedBankAccount(userId, bankAccountId);
        normalizeDefaultAccount(userId, Objects.requireNonNull(target.getId()));
        return linkedBankAccountRepository.findById(Objects.requireNonNull(target.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found"));
    }

    @Transactional
    public void deleteOwnedLinkedBankAccount(String userId, Long bankAccountId) {
        LinkedBankAccount account = findOwnedLinkedBankAccount(userId, bankAccountId);
        boolean wasDefault = Boolean.TRUE.equals(account.getIsDefault());
        linkedBankAccountRepository.delete(account);

        if (!wasDefault) {
            return;
        }

        List<LinkedBankAccount> remaining = linkedBankAccountRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId);
        if (!remaining.isEmpty()) {
            normalizeDefaultAccount(userId, remaining.get(0).getId());
        }
    }

    @Transactional
    public void ensureDefaultLinkedBankAccountExists(String userId) {
        if (linkedBankAccountRepository.existsByUserId(userId)) {
            return;
        }

        LinkedBankAccount defaultBank = new LinkedBankAccount();
        defaultBank.setUserId(userId);
        defaultBank.setBankCode("SCB");
        defaultBank.setBankName("ธนาคารไทยพาณิชย์");
        defaultBank.setAccountNumber("*** *** 4567");
        defaultBank.setAccountName("Mock Account");
        defaultBank.setAccountType("SAVINGS");
        defaultBank.setIsDefault(true);
        defaultBank.setIsVerified(true);
        linkedBankAccountRepository.save(defaultBank);
    }

    @Transactional
    public void normalizeDefaultAccount(String userId, Long targetId) {
        List<LinkedBankAccount> accounts = new ArrayList<>(
                linkedBankAccountRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(userId)
        );
        boolean changed = false;
        for (LinkedBankAccount account : accounts) {
            boolean shouldBeDefault = account.getId().equals(targetId);
            if (!Boolean.valueOf(shouldBeDefault).equals(account.getIsDefault())) {
                account.setIsDefault(shouldBeDefault);
                changed = true;
            }
        }
        if (changed) {
            linkedBankAccountRepository.saveAll(accounts);
        }
    }
}
