// uno.config.ts
import { defineConfig } from 'unocss'
import { presetUno } from 'unocss'
import { presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
  ]
})
