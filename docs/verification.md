# Verification Boundaries

CityLens treats model output as untrusted external data.

The recognition endpoint validates the model response against the typed runtime
contract before returning it to a client. Recognition payloads must contain
bounded confidence values, valid focal-point coordinates, and 3–5 geocoded
nearby POIs. Structurally invalid model output is rejected rather than exposed
as application data.

The deterministic validation suite is not a recognition-accuracy benchmark.
Accuracy claims require a fixed landmark dataset, model/provider version,
sample count, scoring method, evaluation timestamp, and producing commit.
