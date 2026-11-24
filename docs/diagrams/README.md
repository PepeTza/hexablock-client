# Diagrams

## T19 client diagrams (v1)

| Diagram | Owner | Editable Mermaid | SVG |
|---|---|---|---|
| Clean Architecture layers | Jesus | [Source](./client-layers.mmd) | [Export](./client-layers.svg) |
| Engine extensibility | Jesus | [Source](./client-extensibility.mmd) | [Export](./client-extensibility.svg) |

The diagrams show the documented design for v1 and are embedded in the
[client README](../../README.md). Regenerate the vector exports with Mermaid
CLI 11.12.0 from this directory:

```sh
mmdc -i client-layers.mmd -o client-layers.svg -b white
mmdc -i client-extensibility.mmd -o client-extensibility.svg -b white
```

The written [RNF-12](../requirements.md) mentions editable sources. Jesus
reported the instructor's clarification that the delivered diagrams can be
images without an editable file. Use the SVG exports in the README. The
Mermaid sources above are kept for maintenance and regeneration.

Ronald owns the client class diagram. Kenneth owns the backend diagrams in
the backend repository. T39 covers the final set of five diagrams.
