<!-- components/TipTapEditor.vue -->
<script setup lang="ts">
import { watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6]
      }
    }),
    Image.configure({
      allowBase64: true,
      HTMLAttributes: {
        class: 'rounded-xl max-w-full h-auto shadow-md my-4 mx-auto block'
      }
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-emerald-600 dark:text-emerald-400 font-medium underline hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors'
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder || 'Mulai menulis cerita atau artikel luar biasa di sini...'
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    Highlight.configure({
      multicolor: true
    }),
    Underline,
    Color,
    TextStyle,
    FontFamily
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

// Sinkronisasi jika modelValue berubah dari luar (Parent)
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && newValue !== editor.value.getHTML()) {
      editor.value.commands.setContent(newValue, { emitUpdate: false })
    }
  }
)

// Handler untuk Upload / Pilih Gambar
const addImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        editor.value?.chain().focus().setImage({ src: url }).run()
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

// Handler untuk Link
const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href
  const url = window.prompt('Masukkan URL Tautan:', previousUrl)

  if (url === null) return

  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

// Handler untuk Ubah Heading via Select Dropdown
const onHeadingChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'paragraph') {
    editor.value?.chain().focus().setParagraph().run()
  } else {
    const level = parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6
    editor.value?.chain().focus().toggleHeading({ level }).run()
  }
}

// Mendapatkan level heading saat ini untuk dropdown
const getCurrentHeadingValue = () => {
  for (let i = 1; i <= 6; i++) {
    if (editor.value?.isActive('heading', { level: i })) return String(i)
  }
  return 'paragraph'
}

defineExpose({
  editor
})
</script>

<template>
  <div class="tiptap-editor-wrapper rounded-xl border border-emerald-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 transition-all text-slate-800 dark:text-slate-100 font-sans">
    
    <!-- Toolbar -->
    <div class="editor-toolbar flex flex-wrap items-center gap-1.5 p-2.5 border-b border-emerald-950/5 dark:border-slate-800 bg-[#f4f7f5]/80 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-10">
      
      <!-- Heading Dropdown -->
      <div class="flex items-center border-r border-emerald-900/10 dark:border-slate-800 pr-2 mr-0.5">
        <select 
          @change="onHeadingChange" 
          :value="getCurrentHeadingValue()"
          class="text-xs font-medium bg-white dark:bg-slate-800 border border-emerald-900/15 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="paragraph">Teks Normal</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
        </select>
      </div>

      <!-- Format Dasar -->
      <div class="flex items-center gap-0.5 border-r border-emerald-900/10 dark:border-slate-800 pr-2 mr-0.5">
        <button
          type="button"
          @click="editor?.chain().focus().toggleBold().run()"
          :class="['toolbar-btn', editor?.isActive('bold') ? 'is-active' : '']"
          title="Tebal (Bold)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleItalic().run()"
          :class="['toolbar-btn', editor?.isActive('italic') ? 'is-active' : '']"
          title="Miring (Italic)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 4h-9m4 16H5m9-16L10 20"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleUnderline().run()"
          :class="['toolbar-btn', editor?.isActive('underline') ? 'is-active' : '']"
          title="Garis Bawah (Underline)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v7a6 6 0 0012 0V3M4 21h16"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleStrike().run()"
          :class="['toolbar-btn', editor?.isActive('strike') ? 'is-active' : '']"
          title="Coret (Strikethrough)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 4H9a3 3 0 00-2.83 4M14 12a4 4 0 010 8H6m12-8H4"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleHighlight().run()"
          :class="['toolbar-btn', editor?.isActive('highlight') ? 'is-active' : '']"
          title="Sorot (Highlight)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleCode().run()"
          :class="['toolbar-btn', editor?.isActive('code') ? 'is-active' : '']"
          title="Inline Code"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
        </button>
      </div>

      <!-- Color Picker -->
      <div class="flex items-center gap-1 border-r border-emerald-900/10 dark:border-slate-800 pr-2 mr-0.5" title="Warna Teks">
        <label class="toolbar-btn cursor-pointer flex items-center justify-center relative">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10M12 3v18m-4-4h8"/></svg>
          <input 
            type="color" 
            @input="editor?.chain().focus().setColor(($event.target as HTMLInputElement).value).run()"
            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>

      <!-- Perataan Teks (Alignment) -->
      <div class="flex items-center gap-0.5 border-r border-emerald-900/10 dark:border-slate-800 pr-2 mr-0.5">
        <button
          type="button"
          @click="editor?.chain().focus().setTextAlign('left').run()"
          :class="['toolbar-btn', editor?.isActive({ textAlign: 'left' }) ? 'is-active' : '']"
          title="Rata Kiri"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h14"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().setTextAlign('center').run()"
          :class="['toolbar-btn', editor?.isActive({ textAlign: 'center' }) ? 'is-active' : '']"
          title="Rata Tengah"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M7 12h10M5 18h14"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().setTextAlign('right').run()"
          :class="['toolbar-btn', editor?.isActive({ textAlign: 'right' }) ? 'is-active' : '']"
          title="Rata Kanan"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M10 12h10M6 18h14"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().setTextAlign('justify').run()"
          :class="['toolbar-btn', editor?.isActive({ textAlign: 'justify' }) ? 'is-active' : '']"
          title="Rata Kanan Kiri"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      <!-- Lists & Blocks -->
      <div class="flex items-center gap-0.5 border-r border-emerald-900/10 dark:border-slate-800 pr-2 mr-0.5">
        <button
          type="button"
          @click="editor?.chain().focus().toggleBulletList().run()"
          :class="['toolbar-btn', editor?.isActive('bulletList') ? 'is-active' : '']"
          title="Bullet List"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleOrderedList().run()"
          :class="['toolbar-btn', editor?.isActive('orderedList') ? 'is-active' : '']"
          title="Numbered List"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h12M7 12h12M7 17h12M3 7h.01M3 12h.01M3 17h.01"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleBlockquote().run()"
          :class="['toolbar-btn', editor?.isActive('blockquote') ? 'is-active' : '']"
          title="Kutipan (Blockquote)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 9V5H4v10h6m10-6V5h-6v10h6m-10-5h4M4 15h4"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().toggleCodeBlock().run()"
          :class="['toolbar-btn', editor?.isActive('codeBlock') ? 'is-active' : '']"
          title="Blok Kode"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </button>
      </div>

      <!-- Media & Link -->
      <div class="flex items-center gap-0.5 border-r border-emerald-900/10 dark:border-slate-800 pr-2 mr-0.5">
        <button
          type="button"
          @click="addImage"
          class="toolbar-btn"
          title="Sisipkan Gambar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </button>
        <button
          type="button"
          @click="setLink"
          :class="['toolbar-btn', editor?.isActive('link') ? 'is-active' : '']"
          title="Sisipkan Tautan"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        </button>
      </div>

      <!-- Undo / Redo -->
      <div class="flex items-center gap-0.5">
        <button
          type="button"
          @click="editor?.chain().focus().undo().run()"
          :disabled="!editor?.can().undo()"
          class="toolbar-btn disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2m-7-7l-4-4m0 0l4-4m-4 4h14"/></svg>
        </button>
        <button
          type="button"
          @click="editor?.chain().focus().redo().run()"
          :disabled="!editor?.can().redo()"
          class="toolbar-btn disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 10H11a5 5 0 00-5 5v2m7-7l4-4m0 0l-4-4m4 4H3"/></svg>
        </button>
      </div>
    </div>

    <!-- Area Konten Editor -->
    <EditorContent
      :editor="editor"
      class="editor-content prose prose-slate dark:prose-invert max-w-none p-5 min-h-[350px] focus:outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
    />
  </div>
</template>

<style scoped>
/* Tombol Toolbar Style - Hijau Kalem dengan Mode Gelap */
.toolbar-btn {
  @apply p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-emerald-100/60 dark:hover:bg-slate-800 hover:text-emerald-900 dark:hover:text-slate-200 transition-all flex items-center justify-center cursor-pointer;
}

.toolbar-btn.is-active {
  @apply bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 font-semibold shadow-sm;
}

/* Styling Dasar ProseMirror */
.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 350px;
}

/* Placeholder Styling */
.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #94a3b8;
  pointer-events: none;
  height: 0;
}

/* Kustomisasi Gambar */
.editor-content :deep(.ProseMirror img) {
  display: block;
  max-width: 100% !important;
  height: auto !important;
  border-radius: 0.75rem;
  margin: 1rem auto !important;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Blockquote */
.editor-content :deep(.ProseMirror blockquote) {
  border-left: 4px solid #059669;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #475569;
  font-style: italic;
  background-color: #f4f7f5;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-radius: 0 0.375rem 0.375rem 0;
}

:deep(.dark) .editor-content :deep(.ProseMirror blockquote),
.editor-content :deep(.ProseMirror) :global(.dark) blockquote {
  color: #94a3b8;
  background-color: rgba(15, 23, 42, 0.6);
  border-left-color: #10b981;
}

/* Inline Code */
.editor-content :deep(.ProseMirror code) {
  background: #f4f7f5;
  color: #047857;
  padding: 0.2rem 0.4rem;
  border-radius: 0.375rem;
  font-size: 0.875em;
  font-family: monospace;
}

:deep(.dark) .editor-content :deep(.ProseMirror code) {
  background: rgba(30, 41, 59, 0.8);
  color: #34d399;
}

/* Code Block */
.editor-content :deep(.ProseMirror pre) {
  background: #111827;
  color: #f8fafc;
  padding: 1rem;
  border-radius: 0.75rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.editor-content :deep(.ProseMirror pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

/* Lists */
.editor-content :deep(.ProseMirror ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 0.75rem 0;
}

.editor-content :deep(.ProseMirror ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin: 0.75rem 0;
}

/* Headings */
.editor-content :deep(.ProseMirror h1) { font-size: 2rem; font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.5rem; }
.editor-content :deep(.ProseMirror h2) { font-size: 1.5rem; font-weight: 700; margin-top: 1.15rem; margin-bottom: 0.5rem; }
.editor-content :deep(.ProseMirror h3) { font-size: 1.25rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; }
.editor-content :deep(.ProseMirror h4) { font-size: 1.1rem; font-weight: 600; margin-top: 0.85rem; margin-bottom: 0.4rem; }
</style>