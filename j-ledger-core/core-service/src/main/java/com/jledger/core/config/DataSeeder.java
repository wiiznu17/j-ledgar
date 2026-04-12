package com.jledger.core.config;

import com.jledger.core.domain.*;
import com.jledger.core.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.*;

@Configuration
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AdminUserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${jledger.admin.email}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${jledger.admin.password}")
    private String adminPassword;

    private final Random random = new Random();

    @Override
    @Transactional
    public void run(String... args) {
        seedAdminUser();
        if (accountRepository.count() == 0) {
            seedSampleData();
        }
    }

    private void seedAdminUser() {
        if (userRepository.count() == 0) {
            AdminUser admin = AdminUser.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(Role.SUPER_ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("Default Super Admin created: " + adminEmail);
        }
    }

    private void seedSampleData() {
        System.out.println("Seeding sample ledger data...");
        UUID systemUserId = UUID.randomUUID();

        // 1. Create Accounts
        Account cash = createAccount(systemUserId, "Cash on Hand", "100000.00", "THB");
        Account revenue = createAccount(systemUserId, "Sales Revenue", "0.00", "THB");
        Account expense = createAccount(systemUserId, "Utility Expenses", "0.00", "THB");
        Account customerA = createAccount(UUID.randomUUID(), "Customer: John Doe", "500.00", "THB");
        Account customerB = createAccount(UUID.randomUUID(), "Customer: Jane Smith", "1200.00", "THB");

        List<Account> allAccounts = List.of(cash, revenue, expense, customerA, customerB);

        // 2. Generate ~30 Transactions over the last 7 days
        for (int i = 0; i < 35; i++) {
            Account from = allAccounts.get(random.nextInt(allAccounts.size()));
            Account to = allAccounts.get(random.nextInt(allAccounts.size()));

            if (from.getId().equals(to.getId())) {
                to = allAccounts.get((allAccounts.indexOf(from) + 1) % allAccounts.size());
            }

            BigDecimal amount = BigDecimal.valueOf(10 + random.nextInt(490)).setScale(2);
            ZonedDateTime timestamp = ZonedDateTime.now().minusDays(random.nextInt(8)).minusHours(random.nextInt(24));

            createTransaction(from, to, amount, timestamp);
        }

        System.out.println("Sample data seeded successfully!");
    }

    private Account createAccount(UUID userId, String name, String balance, String currency) {
        Account account = Account.builder()
                .userId(userId)
                .accountName(name)
                .balance(new BigDecimal(balance))
                .currency(currency)
                .status("ACTIVE")
                .build();
        return accountRepository.save(account);
    }

    private void createTransaction(Account from, Account to, BigDecimal amount, ZonedDateTime timestamp) {
        String type = "TRANSFER"; // Matches chk_transactions_type

        Transaction tx = Transaction.builder()
                .idempotencyKey("seed-" + UUID.randomUUID())
                .fromAccountId(from.getId())
                .toAccountId(to.getId())
                .transactionType(type)
                .amount(amount)
                .currency(from.getCurrency())
                .status("SUCCESS") // Matches chk_transactions_status
                .createdAt(timestamp) // We attempt to set historical date
                .build();
        
        tx = transactionRepository.save(tx);

        // Double Entry Integrity
        createLedgerEntry(tx, from, "DEBIT", amount, timestamp);
        createLedgerEntry(tx, to, "CREDIT", amount, timestamp);

        // Update account balances (direct update for seeding speed)
        if (from.getBalance().compareTo(amount) >= 0) {
            from.withdraw(amount);
            to.deposit(amount);
            accountRepository.save(from);
            accountRepository.save(to);
        } else {
            System.out.println("Skipping seed transaction: Insufficient balance on " + from.getAccountName());
        }
    }

    private void createLedgerEntry(Transaction tx, Account acc, String type, BigDecimal amount, ZonedDateTime timestamp) {
        LedgerEntry entry = LedgerEntry.builder()
                .transaction(tx)
                .account(acc)
                .entryType(type)
                .amount(amount)
                .createdAt(timestamp)
                .build();
        ledgerEntryRepository.save(entry);
    }
}
