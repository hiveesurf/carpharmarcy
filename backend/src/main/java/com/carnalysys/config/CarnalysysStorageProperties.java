package com.carnalysys.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "carnalysys.storage")
public record CarnalysysStorageProperties(
    String avatarDir, String vehiclesDir, String receiptsDir, String deliveryProofsDir, String logsDir) {

  public String avatarDirOrDefault() {
    return avatarDir != null && !avatarDir.isBlank() ? avatarDir : "/data/carpharmacy/avatars";
  }

  public String vehiclesDirOrDefault() {
    return vehiclesDir != null && !vehiclesDir.isBlank() ? vehiclesDir : "/data/carpharmacy/uploads/vehicles";
  }

  public String receiptsDirOrDefault() {
    return receiptsDir != null && !receiptsDir.isBlank() ? receiptsDir : "/data/carpharmacy/uploads/receipts";
  }

  public String deliveryProofsDirOrDefault() {
    return deliveryProofsDir != null && !deliveryProofsDir.isBlank()
        ? deliveryProofsDir
        : "/data/carpharmacy/uploads/delivery-proofs";
  }

  public String logsDirOrDefault() {
    return logsDir != null && !logsDir.isBlank() ? logsDir : "/data/carpharmacy/logs";
  }
}
