# Evidence and reproducibility policy

CityLens uses AI-generated recognition output, so qualitative capability and measured accuracy must be kept separate.

## Claim classes

- **Capability:** behavior implemented by the application, such as server-side Gemini integration or schema validation.
- **Design target:** desired product or performance threshold. It is not a measured result.
- **Measured result:** an evaluation run tied to a fixed dataset, model/provider, configuration, sample count, timestamp, and commit.
- **Synthetic/demo result:** deterministic test fixtures used to validate application behavior. They are not evidence of real-world landmark-recognition accuracy.

## Recognition evaluations

A published recognition-accuracy claim should include the dataset version, landmark classes or geography covered, model/provider/version where available, sample count, scoring method, confidence handling, and reproducible workflow or command.

Model-generated map coordinates and POI descriptions should be treated as unverified output unless independently checked.

## CI boundary

Required CI proves that type checks, validation tests, and the production build pass. It does not establish field accuracy, geographic coverage, latency at scale, or provider reliability.
