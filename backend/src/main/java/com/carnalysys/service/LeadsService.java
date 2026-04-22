package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.domain.Product;
import com.carnalysys.domain.SellerLead;
import com.carnalysys.domain.VehicleEnquiry;
import com.carnalysys.repo.ProductRepository;
import com.carnalysys.repo.SellerLeadRepository;
import com.carnalysys.repo.VehicleEnquiryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeadsService {

  private final SellerLeadRepository sellerLeadRepository;
  private final VehicleEnquiryRepository vehicleEnquiryRepository;
  private final ProductRepository productRepository;
  private final ObjectMapper objectMapper;

  public LeadsService(
      SellerLeadRepository sellerLeadRepository,
      VehicleEnquiryRepository vehicleEnquiryRepository,
      ProductRepository productRepository,
      ObjectMapper objectMapper) {
    this.sellerLeadRepository = sellerLeadRepository;
    this.vehicleEnquiryRepository = vehicleEnquiryRepository;
    this.productRepository = productRepository;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public Map<String, Object> sellerLead(Map<String, Object> body) {
    SellerLead lead = new SellerLead();
    lead.setSource("seller-form");
    lead.setPayload(objectMapper.valueToTree(body != null ? body : Map.of()));
    sellerLeadRepository.save(lead);
    return Map.of(
        "leadId", "seller-" + lead.getId(),
        "status", "received",
        "echo", body != null ? body : Map.of());
  }

  @Transactional
  public Map<String, Object> vehicleEnquiry(String carProductId, Map<String, Object> body) {
    Product p =
        productRepository
            .findById(carProductId)
            .filter(Product::isPublished)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Vehicle not found"));
    VehicleEnquiry e = new VehicleEnquiry();
    e.setProduct(p);
    e.setPayload(objectMapper.valueToTree(body != null ? body : Map.of()));
    vehicleEnquiryRepository.save(e);
    Map<String, Object> res = new LinkedHashMap<>();
    res.put("enquiryId", "enq-" + e.getId());
    res.put("status", "queued");
    res.put("vehicleId", p.getId());
    res.put("echo", body != null ? body : Map.of());
    return res;
  }
}
