package com.jledger.finance.dto;

import java.util.List;

public record MerchantMultiPayRequest(
    String fromWalletId,
    String currency,
    List<MerchantPayLeg> legs
) {}
