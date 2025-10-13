<template>
  <div class="max-w-4xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-[#0f172a] min-h-screen transition-colors">
    <div v-if="isLoading" class="text-center py-10 text-slate-600 dark:text-slate-400">
      Loading profile for User ID: {{ props.userId }}...
    </div>
    <div v-else-if="!profileData" class="text-center py-10 text-red-500 dark:text-red-400">
      User profile not found.
    </div>

    <template v-else>
      <header class="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 relative transition-colors">
        <div class="relative flex flex-col items-center">
          <div class="w-28 h-28 rounded-full flex items-center justify-center border-4 border-cyan-600 dark:border-cyan-400 bg-cyan-600 dark:bg-cyan-500 shadow-md overflow-hidden">
            <img
              v-if="computedProfileImageSrc"
              :src="computedProfileImageSrc"
              alt="Profile"
              class="w-full h-full object-cover rounded-full"
            />
            <svg
              v-else
              class="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M12 14a4 4 0 100-8 4 4 0 000 8zm0 2c-3 0-6 1.5-6 3v1h12v-1c0-1.5-3-3-6-3z" fill="currentColor"/>
            </svg>
          </div>

          <!-- Sleek, modern v3-style controls for selecting and uploading a profile image -->
          <div v-if="canEditProfilePicture" class="mt-3 flex flex-col sm:flex-row items-center gap-3">
            <!-- Select Photo -->
            <label
              class="group relative inline-flex items-center justify-center gap-2 rounded-xl
                     bg-white/80 dark:bg-slate-700/60 px-4 py-2 text-slate-700 dark:text-slate-100
                     ring-1 ring-slate-200 dark:ring-slate-600 hover:ring-cyan-400 hover:text-cyan-700
                     dark:hover:text-cyan-300 transition shadow-sm cursor-pointer"
            >
              <!-- Camera icon -->
              <svg class="h-5 w-5 text-cyan-600 dark:text-cyan-400 transition-transform group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                      d="M3 8.25A2.25 2.25 0 0 1 5.25 6h2.086a1.5 1.5 0 0 0 1.06-.44l1.128-1.128A1.5 1.5 0 0 1 10.586 3h2.828a1.5 1.5 0 0 1 1.06.44l1.128 1.128a1.5 1.5 0 0 0 1.06.44h2.086A2.25 2.25 0 0 1 21 8.25v8.25A2.25 2.25 0 0 1 18.75 18H5.25A2.25 2.25 0 0 1 3 16.5V8.25Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                      d="M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
              </svg>
              <span class="font-medium">Select Photo</span>

              <!-- Invisible file input -->
              <input
                type="file"
                accept="image/*"
                class="absolute inset-0 opacity-0 cursor-pointer"
                @change="onFileChange"
                tabindex="-1"
                aria-label="Choose profile picture"
              />
            </label>

<button
  @click="upload"
  :disabled="!profilePictureFile"
  class="group relative inline-flex items-center justify-center gap-2 rounded-xl
         border border-slate-300/70 dark:border-slate-600/70 bg-transparent
         px-4 py-2 text-slate-700 dark:text-slate-100 hover:border-cyan-400
         hover:text-cyan-700 dark:hover:text-cyan-300 focus:outline-none
         focus-visible:ring-2 focus-visible:ring-cyan-400
         disabled:opacity-50 disabled:cursor-not-allowed transition"
  aria-label="Upload profile picture"
  type="button"
>
  <!-- Upload icon -->
  <svg class="h-5 w-5 transition-transform group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
          d="M12 16V4m0 0 4 4m-4-4-4 4M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/>
  </svg>
  <span class="font-medium">Upload</span>
</button>

            <!-- Selected file info -->
            <p v-if="profilePictureFile" class="text-xs text-slate-500 dark:text-slate-400">
              {{ profilePictureFile.name }} • {{ (profilePictureFile.size / 1024 / 1024).toFixed(2) }} MB
            </p>
          </div>
        </div>

        <div class="text-center sm:text-left flex-grow">
          <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2 transition-colors">
            {{ profileData.displayName }}
            <span class="text-base font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900 px-2 py-1 rounded ml-2 transition-colors">
              {{ profileData.status }}
            </span>
          </h1>
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-4 text-sm">
            <p class="text-slate-500 dark:text-slate-400 transition-colors">Joined: {{ profileData.joinedDate }}</p>
            <p class="text-slate-500 dark:text-slate-400 transition-colors">Last Seen: {{ profileData.lastSeen }}</p>
          </div>
          <div class="mt-5 flex flex-wrap gap-3 justify-center sm:justify-start">
            <!-- Add/Remove/Accept/Decline buttons -->
           <button
    v-if="!isOwnProfile && friendStatus === 'not_friends'"
    @click="sendFriendRequest"
    type="button"
    aria-label="Add friend"
    class="group relative inline-flex items-center justify-center gap-2 rounded-xl
           border border-slate-300/70 dark:border-slate-600/70 bg-transparent
           px-4 py-2 text-slate-700 dark:text-slate-100 hover:border-cyan-400
           hover:text-cyan-700 dark:hover:text-cyan-300 focus:outline-none
           focus-visible:ring-2 focus-visible:ring-cyan-400 transition"
  >
    <!-- Plus icon -->
    <svg class="h-5 w-5 transition-transform group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 5v14M5 12h14"/>
    </svg>
    <span class="font-medium">Add Friend</span>
  </button>

  <!-- Pending received: Accept / Decline (now outline/ghost styles) -->
  <template v-else-if="!isOwnProfile && friendStatus === 'pending_received'">
    <!-- Remove this span if you don't want the helper text -->
    <span class="text-sm text-slate-600 dark:text-slate-300 self-center">
      {{ profileData.displayName }} sent you a friend request.
    </span>

    <!-- Accept (cyan outline) -->
    <button
      @click="acceptFriend(profileData.id)"
      type="button"
      aria-label="Accept friend request"
      class="group relative inline-flex items-center justify-center gap-2 rounded-xl
             border border-cyan-300/70 dark:border-cyan-700/70 bg-transparent
             px-4 py-2 text-cyan-700 dark:text-cyan-300 hover:border-cyan-400
             hover:text-cyan-600 dark:hover:text-cyan-200 focus:outline-none
             focus-visible:ring-2 focus-visible:ring-cyan-400 transition"
    >
      <!-- Check icon -->
      <svg class="h-5 w-5 transition-transform group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 13l4 4L19 7"/>
      </svg>
      <span class="font-medium">Accept</span>
    </button>

    <!-- Decline (rose outline) -->
    <button
      @click="declineFriend(profileData.id)"
      type="button"
      aria-label="Decline friend request"
      class="group relative inline-flex items-center justify-center gap-2 rounded-xl
             border border-rose-300/70 dark:border-rose-700/70 bg-transparent
             px-4 py-2 text-rose-700 dark:text-rose-300 hover:border-rose-400
             hover:text-rose-500 dark:hover:text-rose-200 focus:outline-none
             focus-visible:ring-2 focus-visible:ring-rose-400 transition"
    >
      <!-- X icon -->
      <svg class="h-5 w-5 transition-transform group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 6l12 12M18 6L6 18"/>
      </svg>
      <span class="font-medium">Decline</span>
    </button>
  </template>

  <!-- Request Sent (sleek outline/ghost + disabled) -->
  <button
    v-else-if="!isOwnProfile && friendStatus === 'pending_sent'"
    type="button"
    disabled
    aria-disabled="true"
    class="group relative inline-flex items-center justify-center gap-2 rounded-xl
           border border-slate-300/70 dark:border-slate-600/70 bg-transparent
           px-4 py-2 text-slate-500 dark:text-slate-400 hover:border-cyan-400
           focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
           disabled:opacity-60 disabled:cursor-not-allowed transition"
  >
    <!-- Clock icon -->
    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke-width="1.8"/>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 7v5l3 2"/>
    </svg>
    <span class="font-medium">Request Sent</span>
  </button>

  <!-- Friends (kept solid for destructive action contrast) -->
  <!-- Remove Friend (sleek outline/ghost style) -->
<button
  v-else-if="!isOwnProfile && friendStatus === 'friends'"
  @click="removeFriend(profileData.id)"
  type="button"
  aria-label="Remove friend"
  class="group relative inline-flex items-center justify-center gap-2 rounded-xl
         border border-rose-300/70 dark:border-rose-700/70 bg-transparent
         px-4 py-2 text-rose-700 dark:text-rose-300 hover:border-rose-400
         hover:text-rose-500 dark:hover:text-rose-200 focus:outline-none
         focus-visible:ring-2 focus-visible:ring-rose-400 transition"
>
  <!-- Minus icon -->
  <svg class="h-5 w-5 transition-transform group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 12h14"/>
  </svg>
  <span class="font-medium">Remove Friend</span>
</button>
</div>
        </div>
      </header>

      <!-- Pending Requests (shows WHO sent the request) -->
      <section
        v-if="isOwnProfile && (pendingIncoming.length > 0 || pendingOutgoing.length > 0)"
        class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-slate-200 dark:border-slate-700 transition-colors"
      >
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4 transition-colors">Pending Requests</h2>

        <div v-if="pendingIncoming.length > 0" class="mb-4">
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Incoming (they sent to you)</h3>
          <div class="flex flex-wrap gap-4">
            <div
              v-for="r in pendingIncoming"
              :key="'in-' + r.id"
              class="flex items-center gap-3 bg-slate-100 dark:bg-slate-700 rounded-lg p-3 shadow transition-colors"
            >
              <img
                :src="r.profilePictureUrl ? resolveAvatar(r.profilePictureUrl) : fallbackAvatar"
                class="w-8 h-8 rounded-full object-cover border-2 border-cyan-400"
              />
              <div>
                <div class="font-semibold text-slate-800 dark:text-white">{{ r.displayName }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-300">Requested {{ since(r.requestedAt) }}</div>
              </div>
              <div class="ml-2 flex gap-2">
                <button
                  class="bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-3 py-1 rounded"
                  @click="acceptFriend(r.id)"
                >
                  Accept
                </button>
                <button
                  class="bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 text-xs px-3 py-1 rounded"
                  @click="declineFriend(r.id)"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="pendingOutgoing.length > 0">
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Outgoing (you sent)</h3>
          <div class="flex flex-wrap gap-4">
            <div
              v-for="r in pendingOutgoing"
              :key="'out-' + r.id"
              class="flex items-center gap-3 bg-slate-100 dark:bg-slate-700 rounded-lg p-3 shadow transition-colors"
            >
              <img
                :src="r.profilePictureUrl ? resolveAvatar(r.profilePictureUrl) : fallbackAvatar"
                class="w-8 h-8 rounded-full object-cover border-2 border-cyan-400"
              />
              <div>
                <div class="font-semibold text-slate-800 dark:text-white">{{ r.displayName }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-300">Requested {{ since(r.requestedAt) }}</div>
              </div>
              <div class="ml-2 flex gap-2">
                <button
                  class="bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 text-xs px-3 py-1 rounded"
                  @click="declineFriend(r.id)"
                  title="Cancel request"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Friends -->
      <section class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-slate-200 dark:border-slate-700 transition-colors">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4 transition-colors">Friends</h2>
        <div v-if="friends.length > 0" class="flex flex-wrap gap-4">
          <div
            v-for="friend in friends"
            :key="friend.id"
            class="flex flex-col items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-3 w-24 shadow transition-colors"
          >
            <div class="w-12 h-12 rounded-full bg-cyan-600/80 dark:bg-cyan-500/80 flex items-center justify-center border border-cyan-300 dark:border-cyan-400 mb-2 overflow-hidden">
              <img
                v-if="friend.profilePictureUrl"
                :src="resolveAvatar(friend.profilePictureUrl)"
                class="w-full h-full object-cover rounded-full"
                alt="Friend Avatar"
              />
              <svg
                v-else
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M12 14a4 4 0 100-8 4 4 0 000 8zm0 2c-3 0-6 1.5-6 3v1h12v-1c0-1.5-3-3-6-3z" fill="currentColor"/>
              </svg>
            </div>
            <span class="text-xs font-bold text-slate-800 dark:text-white transition-colors">{{ friend.displayName }}</span>
            <button
              v-if="isOwnProfile"
              @click="removeFriend(friend.id)"
              class="text-xs text-red-500 mt-1"
            >
              Remove
            </button>
          </div>
        </div>
        <p v-else class="text-slate-500 dark:text-slate-400">No friends to show yet.</p>
      </section>

      <!-- About Me, Activity, Recent Posts (unchanged) -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow border border-slate-200 dark:border-slate-700 transition-colors">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-2xl font-semibold text-slate-900 dark:text-white transition-colors">About Me</h2>
            <button
              v-if="canEditBio"
              @click="editingBio = !editingBio"
              class="text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 px-3 py-1 rounded hover:bg-cyan-200 dark:hover:bg-cyan-800 transition"
            >
              {{ editingBio ? 'Cancel' : 'Edit' }}
            </button>
          </div>
          <template v-if="editingBio && canEditBio">
            <form @submit.prevent="saveBio" class="space-y-2">
              <textarea
                v-model="bioDraft"
                rows="4"
                class="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                maxlength="500"
                placeholder="Write something about yourself..."
              ></textarea>
              <div class="flex gap-2 justify-end">
                <button
                  type="button"
                  @click="editingBio = false"
                  class="px-4 py-2 rounded bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-400 dark:hover:bg-slate-600 transition"
                >Cancel</button>
                <button
                  type="submit"
                  :disabled="isSavingBio"
                  class="px-4 py-2 rounded bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isSavingBio ? 'Saving...' : 'Save' }}
                </button>
              </div>
              <div v-if="bioMessage" class="text-xs text-green-600 dark:text-green-400 mt-1 transition-colors">{{ bioMessage }}</div>
            </form>
          </template>
          <template v-else>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed transition-colors">
              {{ profileData.bio || 'The user has not provided a biography yet.' }}
            </p>
          </template>
        </div>
        <div class="md:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow border border-slate-200 dark:border-slate-700 space-y-3 transition-colors">
          <h2 class="text-2xl font-semibold mb-3 text-slate-900 dark:text-white transition-colors">Activity</h2>
          <div class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 transition-colors">
            <span class="text-slate-600 dark:text-slate-400 transition-colors">Posts:</span>
            <span class="font-bold text-slate-900 dark:text-white transition-colors">{{ profileData.postCount }}</span>
          </div>
          <div class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 transition-colors">
            <span class="text-slate-600 dark:text-slate-400 transition-colors">Comments:</span>
            <span class="font-bold text-slate-900 dark:text-white transition-colors">{{ profileData.commentCount }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600 dark:text-slate-400 transition-colors">Resources Shared:</span>
            <span class="font-bold text-slate-900 dark:text-white transition-colors">{{ profileData.resourceCount }}</span>
          </div>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-semibold text-slate-900 dark:text-white transition-colors">Recent Posts & Replies</h2>
          <span v-if="filteredUserActivity.length" class="text-xs text-slate-500 dark:text-slate-400 transition-colors">
            Showing {{ filteredUserActivity.length }} items
          </span>
        </div>
        <div
          v-if="filteredUserActivity.length > 0"
          class="space-y-3 max-h-96 overflow-y-auto pr-2"
          style="scrollbar-width: thin;"
          :style="{ scrollbarColor: isDarkMode ? '#22d3ee #1e293b' : '#22d3ee #e0e7ef' }"
        >
          <div v-for="item in filteredUserActivity" :key="item.key"
            class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition">
            <template v-if="item.type === 'post'">
              <router-link
                :to="{ name: 'PostDetail', params: { id: item.id } }"
                class="text-lg font-medium text-cyan-600 dark:text-cyan-400 hover:underline block truncate transition-colors"
              >
                {{ item.title }}
              </router-link>
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-1 transition-colors">
                {{ item.excerpt }}
              </p>
              <span class="text-xs text-slate-500 dark:text-slate-500 mt-2 block">Posted {{ item.displayDate }}</span>
            </template>
            <template v-else-if="item.type === 'reply'">
              <router-link
                :to="{ name: 'PostDetail', params: { id: item.parentPostId } }"
                class="text-cyan-600 dark:text-cyan-400 hover:underline text-sm block transition-colors"
              >
                In Thread: {{ item.parentPostTitle || 'View Post' }}
              </router-link>
              <p class="text-slate-700 dark:text-slate-300 mt-1 transition-colors">
                {{ item.excerpt }}
              </p>
              <span class="text-xs text-slate-500 dark:text-slate-500 mt-2 block">Replied {{ item.displayDate }}</span>
            </template>
          </div>
        </div>
        <p v-else class="text-slate-500 dark:text-slate-400 py-4 transition-colors">No recent posts or replies to display.</p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import api from '@/api';

const props = defineProps<{ userId: string }>();

interface ActivityItem {
  key: string;
  id: string;
  type: 'post' | 'reply';
  title?: string;
  excerpt: string;
  displayDate: string;
  ts: number;
  parentPostId?: string;
  parentPostTitle?: string;
}

interface Friend {
  id: string;
  displayName: string;
  profilePictureUrl?: string | null;
}

interface PendingRequest extends Friend {
  requestedAt?: string;
}

interface ProfileDetails {
  id: string;
  displayName: string;
  status: 'Online' | 'Away' | 'Offline';
  bio: string;
  joinedDate: string;
  lastSeen: string;
  postCount: number;
  commentCount: number;
  resourceCount: number;
  recent_posts: any[];
  recent_replies?: any[];
  profilePictureUrl?: string | null;
}

const auth = useAuthStore();
const themeStore = useThemeStore();

const profileData = ref<ProfileDetails | null>(null);
const isLoading = ref(true);

// Avatar upload state
const profilePictureUrl = ref<string | null>(null);
const profilePictureFile = ref<File | null>(null);
const profilePicturePreview = ref<string>('');

// Edit About Me
const editingBio = ref(false);
const bioDraft = ref('');
const isSavingBio = ref(false);
const bioMessage = ref('');

// Friends & status
const friends = ref<Friend[]>([]);
const friendStatus = ref<'not_friends' | 'friends' | 'pending_sent' | 'pending_received'>('not_friends');
const pendingIncoming = ref<PendingRequest[]>([]);
const pendingOutgoing = ref<PendingRequest[]>([]);

const isDarkMode = computed(() => themeStore.theme === 'dark');
const isOwnProfile = computed(() => !!(auth.user?.id && profileData.value && auth.user.id === profileData.value.id));

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const fallbackAvatar = '/default-avatar.png';

function resolveAvatar(path: string) {
  if (!path) return fallbackAvatar;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return backendUrl.replace(/\/$/, '') + (path.startsWith('/') ? '' : '/') + path;
}

const computedProfileImageSrc = computed(() => {
  if (profilePicturePreview.value) return profilePicturePreview.value;
  if (!profilePictureUrl.value) return undefined;
  if (profilePictureUrl.value.startsWith('http://') || profilePictureUrl.value.startsWith('https://') || profilePictureUrl.value.startsWith('blob:')) {
    return profilePictureUrl.value;
  }
  return backendUrl.replace(/\/$/, '') + (profilePictureUrl.value.startsWith('/') ? '' : '/') + profilePictureUrl.value;
});

const formatHuman = (ts: number): string => {
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hrs ago`;
  return new Date(ts).toLocaleDateString('en-GB');
};

const since = (iso?: string) => {
  if (!iso) return '';
  const ts = new Date(iso).getTime();
  return formatHuman(ts);
};

const formatLastSeen = (dateString: string): string => {
  const ts = new Date(dateString).getTime();
  return formatHuman(ts);
};

const filteredUserActivity = computed<ActivityItem[]>(() => {
  if (!profileData.value) return [];
  const posts: ActivityItem[] = (profileData.value.recent_posts || [])
    .filter((p: any) => !!p.id)
    .map((p: any) => {
      const ts = new Date(p.created_at).getTime();
      return {
        key: `post-${p.id}-${ts}`,
        id: p.id,
        type: 'post' as const,
        title: p.title || 'Untitled',
        excerpt: p.content ? p.content.substring(0, 100) + '...' : '',
        displayDate: formatHuman(ts),
        ts,
      };
    });

  const replies: ActivityItem[] = (profileData.value.recent_replies || [])
    .filter((r: any) => !!r.id && !!r.parent_post_id)
    .map((r: any) => {
      const ts = new Date(r.created_at).getTime();
      return {
        key: `reply-${r.id}-${ts}`,
        id: r.id,
        type: 'reply' as const,
        excerpt: r.content ? r.content.substring(0, 100) + '...' : '',
        displayDate: formatHuman(ts),
        ts,
        parentPostId: r.parent_post_id,
        parentPostTitle: r.parent_post_title,
      };
    });

  return [...posts, ...replies].sort((a, b) => b.ts - a.ts);
});

const fetchProfile = async (id: string) => {
  if (!id) return;
  isLoading.value = true;
  profileData.value = null;
  try {
    const { data } = await api.get(`/api/profiles/${id}`, { withCredentials: true });
    profileData.value = {
      id: data.id,
      displayName: data.displayName,
      status: data.status,
      bio: data.bio || '',
      joinedDate: data.joined_at ? new Date(data.joined_at).toLocaleDateString('en-GB') : '',
      lastSeen: data.last_active ? formatLastSeen(data.last_active) : '',
      postCount: data.stats?.posts || 0,
      commentCount: data.stats?.comments || 0,
      resourceCount: data.stats?.resources || 0,
      recent_posts: data.recent_posts || [],
      recent_replies: data.recent_replies || [],
      profilePictureUrl: data.profilePictureUrl || null,
    };
    profilePictureUrl.value = data.profilePictureUrl || null;
    profilePicturePreview.value = '';
    profilePictureFile.value = null;
    bioDraft.value = profileData.value.bio;
    editingBio.value = false;
    bioMessage.value = '';
  } catch (error) {
    console.error('Error fetching profile:', error);
    profileData.value = null;
  } finally {
    isLoading.value = false;
  }
};

async function fetchFriendshipStatus() {
  if (!profileData.value || isOwnProfile.value) return;

  // Accepted friends (for current user)
  const res = await api.get('/api/friends/list', { withCredentials: true }).catch(() => null);
  if (res?.status === 200) {
    const myFriends: Friend[] = res.data;
    if (myFriends.some((f) => f.id === profileData.value!.id)) {
      friendStatus.value = 'friends';
      return;
    }
  }

  // Outgoing pending requests
  const sent = await api.get('/api/friends/pending-sent', { withCredentials: true }).catch(() => null);
  if (sent?.status === 200) {
    const sentPendings: PendingRequest[] = sent.data;
    if (sentPendings.some((f) => f.id === profileData.value!.id)) {
      friendStatus.value = 'pending_sent';
      return;
    }
  }

  // Incoming pending requests
  const received = await api.get('/api/friends/pending', { withCredentials: true }).catch(() => null);
  if (received?.status === 200) {
    const receivedPendings: PendingRequest[] = received.data;
    if (receivedPendings.some((f) => f.id === profileData.value!.id)) {
      friendStatus.value = 'pending_received';
      return;
    }
  }

  friendStatus.value = 'not_friends';
}

const fetchFriendsOfProfile = async () => {
  if (!profileData.value) return;
  const res = await api
    .get('/api/friends/list', { params: { userId: profileData.value.id }, withCredentials: true })
    .catch(() => null);
  friends.value = res?.status === 200 ? res.data : [];
};

const fetchPendingForMe = async () => {
  // Only relevant for own profile: show who sent/received requests
  if (!isOwnProfile.value) {
    pendingIncoming.value = [];
    pendingOutgoing.value = [];
    return;
  }
  const [incoming, outgoing] = await Promise.all([
    api.get('/api/friends/pending', { withCredentials: true }).catch(() => null),
    api.get('/api/friends/pending-sent', { withCredentials: true }).catch(() => null),
  ]);
  pendingIncoming.value = incoming?.status === 200 ? incoming.data : [];
  pendingOutgoing.value = outgoing?.status === 200 ? outgoing.data : [];
};

async function sendFriendRequest() {
  if (!profileData.value) return;
  const res = await api
    .post(`/api/friends/request/${profileData.value.id}`, undefined, { withCredentials: true })
    .catch(() => null);
  if (res?.status === 200) {
    friendStatus.value = 'pending_sent';
    await Promise.all([fetchFriendsOfProfile(), fetchPendingForMe()]);
  } else {
    const errMsg = (res as any)?.data?.message || 'Failed to send friend request';
    alert(errMsg);
  }
}

async function acceptFriend(friendId: string) {
  const res = await api.post(`/api/friends/accept/${friendId}`, undefined, { withCredentials: true }).catch(() => null);
  if (res?.status === 200) {
    friendStatus.value = isOwnProfile.value ? friendStatus.value : 'friends';
    await Promise.all([fetchFriendsOfProfile(), fetchPendingForMe(), fetchFriendshipStatus()]);
  } else {
    alert((res as any)?.data?.message || 'Failed to accept request');
  }
}

async function declineFriend(friendId: string) {
  const res = await api.post(`/api/friends/decline/${friendId}`, undefined, { withCredentials: true }).catch(() => null);
  if (res?.status === 200) {
    if (!isOwnProfile.value) friendStatus.value = 'not_friends';
    await Promise.all([fetchFriendsOfProfile(), fetchPendingForMe(), fetchFriendshipStatus()]);
  } else {
    alert((res as any)?.data?.message || 'Failed to decline request');
  }
}

async function removeFriend(friendId: string) {
  const res = await api.delete(`/api/friends/remove/${friendId}`, { withCredentials: true }).catch(() => null);
  if (res?.status === 200) {
    if (isOwnProfile.value) {
      friends.value = friends.value.filter((f) => f.id !== friendId);
    } else {
      friendStatus.value = 'not_friends';
    }
    await Promise.all([fetchFriendsOfProfile(), fetchPendingForMe(), fetchFriendshipStatus()]);
  } else {
    alert((res as any)?.data?.message || 'Failed to remove friend');
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files?.length) return;
  profilePictureFile.value = target.files[0];
  profilePicturePreview.value = URL.createObjectURL(profilePictureFile.value);
}

async function upload() {
  if (!profilePictureFile.value) return;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(profilePictureFile.value.type)) {
    alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    return;
  }
  const maxSize = 5 * 1024 * 1024;
  if (profilePictureFile.value.size > maxSize) {
    alert('File is too large. Maximum size is 5MB.');
    return;
  }

  const formData = new FormData();
  formData.append('avatar', profilePictureFile.value);

  try {
    const { data } = await api.post('/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    profilePictureUrl.value = data.profilePictureUrl;
    if (profileData.value) profileData.value.profilePictureUrl = data.profilePictureUrl;
    if ((auth as any).updateProfilePictureUrl) (auth as any).updateProfilePictureUrl(data.profilePictureUrl);
    profilePicturePreview.value = '';
    profilePictureFile.value = null;
    alert('Profile picture uploaded successfully!');
  } catch (err: any) {
    console.error('Failed to upload avatar:', err);
    const errorMsg = err?.response?.data?.message || 'Failed to upload avatar. Please try again.';
    alert(errorMsg);
  }
}

const canEditProfilePicture = computed(() => auth.user?.id && profileData.value && auth.user.id === profileData.value.id);
const canEditBio = computed(() => auth.user?.id && profileData.value && auth.user.id === profileData.value.id);

const saveBio = async () => {
  if (!canEditBio.value || !profileData.value) return;
  isSavingBio.value = true;
  bioMessage.value = '';
  try {
    await api.put(`/api/profiles/${profileData.value.id}`, { bio: bioDraft.value }, { withCredentials: true });
    bioMessage.value = 'About Me updated!';
    profileData.value.bio = bioDraft.value;
    editingBio.value = false;
  } catch (err) {
    console.error('Failed to update bio:', err);
    bioMessage.value = 'Failed to update bio.';
  } finally {
    isSavingBio.value = false;
  }
};

onMounted(async () => {
  isLoading.value = true;
  await fetchProfile(props.userId);
  await Promise.all([fetchFriendshipStatus(), fetchFriendsOfProfile(), fetchPendingForMe()]);
  isLoading.value = false;
});

watch(
  () => props.userId,
  async (newId) => {
    if (!newId) return;
    isLoading.value = true;
    await fetchProfile(newId);
    await Promise.all([fetchFriendshipStatus(), fetchFriendsOfProfile(), fetchPendingForMe()]);
    isLoading.value = false;
  }
);
</script>