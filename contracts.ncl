# contracts.ncl
# Nickel Contracts for ProgBlocks configuration

let Config = {
  version | String | default = "1.0.0",
  entry_points | Array String | default = ["src/prog-block.js"],
  styles | Array String | default = ["src/prog-block.css"],
  a2ml_dialect_version | String | default = "1.1",
  accessibility_standard | String | default = "WCAG_AAA",
} in

{
  package_config | Config = {
    version = "1.0.0",
    entry_points = ["src/prog-block.js"],
    styles = ["src/prog-block.css"],
    a2ml_dialect_version = "1.1",
    accessibility_standard = "WCAG_AAA"
  }
}
