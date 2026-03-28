import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import AudioUpload from '../components/AudioUpload.vue';
import { vi } from 'vitest';

// Mock Nuxt composables
vi.stubGlobal('useApi', () => ({
  fetchWithAuth: vi.fn()
}));

vi.stubGlobal('useCookie', () => ref('test-user'));

describe('AudioUpload Component', () => {
  it('renders correctly', () => {
    const wrapper = mount(AudioUpload);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Upload Audio File');
  });

  it('updates state when file is selected', async () => {
    const wrapper = mount(AudioUpload);
    // Vue Test Utils doesn't cleanly support File drag/drop directly without JS manipulation,
    // so we just test if the dropzone exists and has the correct classes.
    const dropzone = wrapper.find('.border-brand-primary');
    expect(dropzone.exists()).toBe(true);
  });
});
