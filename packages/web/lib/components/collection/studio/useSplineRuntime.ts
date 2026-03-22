"use client";

import { useRef, useCallback } from "react";
import type { Application, SPEObject } from "@splinetool/runtime";

/**
 * Stores the Spline Application ref and exposes typed control methods.
 * Consumed by SplineStudio and useStudioSync.
 */
export function useSplineRuntime() {
  const splineRef = useRef<Application | null>(null);

  /** Called by <Spline onLoad={}> to capture the Application instance */
  const onLoad = useCallback((spline: Application) => {
    splineRef.current = spline;
  }, []);

  /** Find a scene object by its editor name */
  const findObject = useCallback((name: string): SPEObject | undefined => {
    return splineRef.current?.findObjectByName(name);
  }, []);

  /** Trigger a Spline event on a named object */
  const triggerEvent = useCallback((event: string, name: string): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    splineRef.current?.emitEvent(event as any, name);
  }, []);

  /** Set a Spline Variable (String | Number | Boolean only) */
  const setVar = useCallback(
    (name: string, value: string | number | boolean): void => {
      splineRef.current?.setVariable(name, value);
    },
    []
  );

  /**
   * Animate the MainCamera to a named state using Spline's transition API.
   * Uses easing 4 (EASE_IN_OUT) by default.
   */
  const transitionCamera = useCallback(
    (stateName: string, durationMs = 600): void => {
      const camera = splineRef.current?.findObjectByName("MainCamera");
      // SPEObject.transition() exists on the runtime object at runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (camera as any)?.transition({
        to: stateName,
        duration: durationMs,
        easing: 4,
      });
    },
    []
  );

  return {
    onLoad,
    splineRef,
    findObject,
    triggerEvent,
    setVar,
    transitionCamera,
  };
}
