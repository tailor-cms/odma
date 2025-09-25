<template>
  <NuxtLayout name="main">
    <VContainer>
      <VRow no-gutters>
        <VCol>
          <h1 class="text-white text-h2 mt-15">Welcome 👋</h1>
        </VCol>
      </VRow>
    </VContainer>
  </NuxtLayout>
</template>

<script lang="ts" setup>
definePageMeta({
  name: 'catalog',
  middleware: ['auth'],
});
</script>
