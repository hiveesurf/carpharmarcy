package com.carnalysys.testsupport;

import org.springframework.context.annotation.Import;

/** Shared imports for controller slice tests (see {@link WebMvcSliceTestConfiguration}). */
@Import(WebMvcSliceTestConfiguration.class)
public abstract class ControllerSliceTestBase {}
