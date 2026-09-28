// Explicit pause must settle residual damping too. Otherwise a low-frame-rate
// device can keep scheduling expensive frames for seconds after the user pauses.
export function setOrbitRotation(controls, enabled) {
  controls.autoRotate = enabled;
  if (!enabled) {
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    try { controls.update(0); } finally { controls.enableDamping = damping; }
  }
}
