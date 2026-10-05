# contracts.ncl
# Nickel Contracts for ProgBlocks configuration

let Config = {
  version | String | default = "0.3.0",
  entry_points | Array String | default = ["src/prog-block.js"],
  styles | Array String | default = ["src/prog-block.css"],
  accessibility_standard | String | default = "WCAG_2.1_AA_target",
} in

{
  package_config | Config = {
    version = "0.3.0",
    entry_points = ["src/prog-block.js"],
    styles = ["src/prog-block.css"],
    accessibility_standard = "WCAG_2.1_AA_target"
  }
}
