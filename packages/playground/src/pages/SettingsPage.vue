<script setup lang="ts"></script>

<template>
  <div class="page-settings">
    <h2>设置</h2>
    <div class="settings-group">
      <div class="settings-item">
        <div>
          <div class="settings-item__label">
            字体大小
          </div>
          <div class="settings-item__desc">
            编辑器字体大小（像素）
          </div>
        </div>
        <input
          class="settings-input"
          type="number"
          value="14"
          min="10"
          max="32"
        >
      </div>
      <div class="settings-item">
        <div>
          <div class="settings-item__label">
            缩进大小
          </div>
          <div class="settings-item__desc">
            每个 Tab 的空格数
          </div>
        </div>
        <select class="settings-select">
          <option>2</option>
          <option selected>
            4
          </option>
          <option>8</option>
        </select>
      </div>
      <div class="settings-item">
        <div>
          <div class="settings-item__label">
            自动换行
          </div>
          <div class="settings-item__desc">
            编辑器长行自动换行
          </div>
        </div>
        <input
          class="settings-checkbox"
          type="checkbox"
          checked
        >
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-settings {
  padding: 24px 32px;
  color: hsl(var(--layplux-foreground));
  /* stylelint-disable-next-line order/properties-order */
  height: 100%;
  overflow: auto;
}

.page-settings h2 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  /* stylelint-disable-next-line order/properties-order */
  align-items: center;
  padding: 12px 16px;
  border: 1px solid hsl(var(--layplux-border));
  border-radius: 6px;
  /* stylelint-disable-next-line order/properties-order */
  background: hsl(var(--layplux-accent));
}

.settings-item__label {
  font-size: 13px;
  font-weight: 500;
}

.settings-item__desc {
  margin-top: 2px;
  font-size: 11px;
  color: hsl(var(--layplux-muted-foreground));
}

.settings-input,
.settings-select {
  width: 80px;
  padding: 4px 8px;
  font-size: 13px;
  background: hsl(var(--layplux-background));
  border: 1px solid hsl(var(--layplux-border));
  border-radius: 4px;
  /* stylelint-disable-next-line order/properties-order */
  color: hsl(var(--layplux-foreground));
}

.settings-checkbox {
  width: 18px;
  height: 18px;
  accent-color: hsl(var(--layplux-primary));
}
</style>
