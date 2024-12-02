<script lang="ts" setup>
import { setColorScheme } from 'mdui/functions/setColorScheme.js'

import 'mdui/components/button.js'
import 'mdui/components/card.js'
import 'mdui/components/avatar.js'
import 'mdui/components/button-icon.js'
import 'mdui/components/fab.js'
import 'mdui/components/navigation-bar-item.js'
import 'mdui/components/navigation-bar.js'
import 'mdui/components/navigation-rail-item.js'
import 'mdui/components/navigation-rail.js'
import 'mdui/components/tooltip.js'
import 'mdui/components/list.js';
import 'mdui/components/list-item.js';
import 'mdui/components/list-subheader.js';
import 'mdui/components/collapse.js';
import 'mdui/components/collapse-item.js';
import 'mdui/components/tooltip.js';

setColorScheme('#5cabff')
</script>

<template>
    <Navbar />
  <div class="p-4">
    <router-view />
  </div>
  <BackToTop />
  <Footer />
</template>

<style scoped></style>
