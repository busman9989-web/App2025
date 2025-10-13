<template>
  <div class="space-y-8 py-8 px-4 bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">
        Welcome, {{ auth.user?.displayName || 'Guest' }}
      </h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400 transition-colors">
        How can we support you today?
      </p>
    </div>

    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <section class="lg:col-span-2 flex flex-col gap-6">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-colors">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2 transition-colors">Good to see you here!</h2>
          <p class="text-slate-600 dark:text-slate-400 text-sm transition-colors">
            This is your personal space to plan, journal, and track your mood. 
            Use the cards below to quickly access your tools or check in with yourself.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <HomeNavCard
            to="/planner"
            :icon="PlannerIcon"
            title="Planner"
            description="Appointments & lists."
            class="bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 rounded-xl shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          />
          <HomeNavCard
            to="/journal"
            :icon="JournalIcon"
            title="Journal"
            description="A secure space."
            class="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          />
        </div>

        <MoodTracker class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg" />

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col gap-4">
          <h3 class="text-xl font-semibold text-slate-900 dark:text-white">Top Posts Today</h3>
          <div class="space-y-3">
            <div v-if="isLoadingPosts" class="text-center text-slate-600 dark:text-slate-400 py-4">
              <svg class="animate-spin h-5 w-5 text-cyan-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-2 text-sm">Loading posts...</p>
            </div>

            <div v-else-if="posts.length === 0" class="text-center text-slate-600 dark:text-slate-400 py-4">
              No posts found yet.
            </div>

            <div
              v-else
              v-for="(post, index) in posts"
              :key="post.id"
              class="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border"
              :class="`border-l-4 ${['border-cyan-500', 'border-teal-500', 'border-indigo-500'][index % 3]}`"
            >
              <span class="text-sm font-semibold text-slate-900 dark:text-white block truncate">{{ post.content.substring(0, 100) }}{{ post.content.length > 100 ? '...' : '' }}</span>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Posted by: {{ post.authorName }} • {{ post.comment_count }} replies</p>
            </div>
          </div>
        </div>
      </section>

      <aside class="lg:col-span-1 flex flex-col gap-6">
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Tasks</h3>
          <div class="space-y-4">
            <div v-if="isLoadingChecklists" class="text-center text-slate-600 dark:text-slate-400 py-4">
              <svg class="animate-spin h-5 w-5 text-teal-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-2 text-sm">Loading tasks...</p>
            </div>

            <div v-else-if="checklists.length === 0" class="text-center text-slate-600 dark:text-slate-400 py-4">
              No active checklists found.
            </div>

            <div 
              v-else
              v-for="(list, listIndex) in checklists"
              :key="list.id"
              class="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700/60"
            >
              <h4 
                class="font-semibold mb-2 truncate"
                :class="`text-${list.color}-400`"
              >
                {{ list.title }}
              </h4>
              
              <div class="space-y-2 mt-2">
                <div 
                  v-for="(item, itemIndex) in list.fullItems" 
                  :key="`${list.id}-${itemIndex}`"
                  class="flex items-center gap-2 text-sm text-slate-900 dark:text-white"
                >
                  <input 
                    type="checkbox" 
                    :checked="item.completed" 
                    @change="toggleTaskCompletion(listIndex, itemIndex)" class="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex-shrink-0"
                    :class="`text-${list.color}-500 focus:ring-${list.color}-500`"
                  >
                  <span :class="{ 'line-through text-slate-400': item.completed, 'truncate': true }">
                    {{ item.text }}
                  </span>
                </div>
                <div v-if="list.fullItems.length === 0" class="text-xs text-slate-500 italic mt-2">
                  No items in this checklist.
                </div>
              </div>
              <span class="text-xs text-slate-500 mt-2 block">
                {{ list.completedTasks }} of {{ list.totalTasks }} items completed
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h3 class="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Recent Notes</h3>
          <div class="space-y-4">
            <div v-if="isLoadingJournals" class="text-center text-slate-600 dark:text-slate-400 py-4">
              <svg class="animate-spin h-5 w-5 text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-2 text-sm">Loading notes...</p>
            </div>

            <div v-else-if="journalEntries.length === 0" class="text-center text-slate-600 dark:text-slate-400 py-4">
              No recent journal entries found.
            </div>

            <div 
              v-else
              v-for="entry in journalEntries" 
              :key="entry.id" 
              class="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-b-0"
            >
              <p class="text-sm text-slate-900 dark:text-white font-medium">{{ entry.excerpt }}</p>
              <span class="text-xs text-slate-500 mt-1 block">Journal • {{ entry.date }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, VNode, ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/api';
import HomeNavCard from '@/components/HomeNavCard.vue';
import MoodTracker from '@/components/MoodTracker.vue';

const auth = useAuthStore();

// --- Interfaces ---
interface Checklist {
  id: string;
  title: string;
  totalTasks: number;
  completedTasks: number;
  firstTask: { text: string; completed: boolean }; 
  color: string;
  fullItems: { text: string; completed: boolean }[]; 
}

interface JournalEntry {
  id: string;
  entry_date: string;
  mood_rating: number;
  entry_text: string;
  excerpt: string;
  date: string;
}

interface Post {
  id: string;
  content: string;
  category: string;
  isAnonymous: boolean;
  created_at: string;
  authorName: string;
  comment_count: number;
  score: number;
  userVote: number;
}

// --- Reactive State ---
const checklists = ref<Checklist[]>([]);
const isLoadingChecklists = ref(true);

const journalEntries = ref<JournalEntry[]>([]);
const isLoadingJournals = ref(true);

const posts = ref<Post[]>([]);
const isLoadingPosts = ref(true);

// --- Utility ---
const formatRelativeDate = (dateString: string): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return 'Today';
  if (diffDays < 2) return 'Yesterday';
  if (diffDays < 7) return `${Math.floor(diffDays)} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- API Calls ---
const fetchChecklists = async () => {
  isLoadingChecklists.value = true;
  try {
    const response = await api.get('/api/checklists');
    const apiData = response.data;
    const colors = ['teal', 'blue', 'indigo', 'cyan'];
    checklists.value = apiData.slice(0, 2).map((list: any, i: number) => ({
      id: list.id,
      title: list.name,
      totalTasks: list.items?.length || 0,
      completedTasks: list.items?.filter((it: any) => it.completed).length || 0,
      firstTask: list.items?.[0] || { text: 'No tasks found.', completed: false },
      color: colors[i % colors.length],
      fullItems: list.items || [] 
    }));
  } catch (e) {
    console.error('Failed to fetch checklists:', e);
  } finally {
    isLoadingChecklists.value = false;
  }
};

const fetchJournalEntries = async () => {
  isLoadingJournals.value = true;
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await api.get(`/api/journal?startDate=${startDate}&endDate=${endDate}`);
    const apiData = response.data;
    journalEntries.value = apiData.slice(0, 2).map((entry: any) => {
      const fullText = entry.entry_text || 'No content written.';
      return {
        id: entry.id,
        entry_date: entry.entry_date,
        mood_rating: entry.mood_rating,
        entry_text: fullText,
        excerpt: fullText.substring(0, 80) + (fullText.length > 80 ? '...' : ''),
        date: formatRelativeDate(entry.entry_date)
      };
    });
  } catch (e) {
    console.error('Failed to fetch journal entries:', e);
  } finally {
    isLoadingJournals.value = false;
  }
};

const fetchPosts = async () => {
  isLoadingPosts.value = true;
  try {
    const response = await api.get('/api/posts');
    const apiData = response.data;
    posts.value = apiData.slice(0, 3).map((p: any) => ({
      id: p.id,
      content: p.content || '',
      category: p.category || 'general',
      isAnonymous: p.isAnonymous || false,
      created_at: p.created_at || new Date().toISOString(),
      authorName: p.authorName || p.display_name || 'Anonymous',
      comment_count: p.comment_count || 0,
      score: p.score || 0,
      userVote: p.userVote || 0
    }));
  } catch (e) {
    console.error('Failed to fetch posts:', e);
  } finally {
    isLoadingPosts.value = false;
  }
};

// --- Task Toggle Logic ---
// UPDATED to accept itemIndex
const toggleTaskCompletion = async (listIndex: number, itemIndex: number) => {
    const list = checklists.value[listIndex];
    if (!list || !list.fullItems || list.fullItems.length === 0) return;

    // Target the specific item using itemIndex
    const item = list.fullItems[itemIndex];
    
    // Optimistic update: flip the completed status immediately
    item.completed = !item.completed;
    
    // Recalculate and update local state metrics
    list.completedTasks = list.fullItems.filter(i => i.completed).length;

    try {
        // Send the updated full list of items back to the API
        await api.put(`/api/checklists/${list.id}`, {
            name: list.title, 
            items: list.fullItems
        });
        
    } catch (e) {
        console.error('Failed to update task completion:', e);
        alert('Could not save task change. Please try again.');
        
        // Revert the optimistic update on failure
        item.completed = !item.completed;
        list.completedTasks = list.fullItems.filter(i => i.completed).length;
    }
};

// --- Lifecycle ---
onMounted(() => {
  fetchChecklists();
  fetchJournalEntries();
  fetchPosts();
});

// --- Icons ---
const Icon = (props: { path: VNode | VNode[]; class?: string }) =>
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', class: props.class || 'h-6 w-6', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': 2 }, props.path);

const PlannerIcon = () =>
  h(Icon, {
    class: 'h-7 w-7 text-teal-600 dark:text-teal-400 transition-colors',
    path: h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' })
  });

const JournalIcon = () =>
  h(Icon, {
    class: 'h-7 w-7 text-blue-600 dark:text-blue-400 transition-colors',
    path: h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 6.253v11.494m-5.747-4.995l-1.35 1.35A5.003 5.003 0 0012 21.75a5.003 5.003 0 007.097-7.097l-1.35-1.35-2.296 2.296-2.297-2.296-2.15-2.15z' })
  });
</script>