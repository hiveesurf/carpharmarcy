package com.carnalysys.testsupport;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Test-only controller to assert {@code GlobalExceptionHandler} never leaks stacks to clients. */
@RestController
public class InternalErrorSmokeController {

  @GetMapping("/__test/internal-error")
  public void boom() {
    throw new RuntimeException("secret internal\n\tat com.carnalysys.ShouldNotAppear");
  }
}
