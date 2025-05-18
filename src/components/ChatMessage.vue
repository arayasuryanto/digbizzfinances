<template>
  <div class="message" :class="message.sender">
    <div class="message-bubble">
      {{ message.text }}
    </div>
    <div class="message-time">
      {{ formattedTime }}
    </div>
  </div>
</template>

<script>
import { format } from 'date-fns';

export default {
  name: 'ChatMessage',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  computed: {
    formattedTime() {
      return format(new Date(this.message.timestamp), 'h:mm a');
    }
  }
}
</script>

<style scoped>
.message {
  display: flex;
  flex-direction: column;
  max-width: 80%;
  margin-bottom: 0.5rem;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-bubble {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  position: relative;
  word-break: break-word;
}

.message.user .message-bubble {
  background-color: #3498db;
  color: white;
  border-bottom-right-radius: 0;
}

.message.assistant .message-bubble {
  background-color: #f1f3f5;
  color: #212529;
  border-bottom-left-radius: 0;
}

.message-time {
  font-size: 0.7rem;
  color: #6c757d;
  margin-top: 0.25rem;
  align-self: flex-end;
}

.message.user .message-time {
  align-self: flex-end;
}

.message.assistant .message-time {
  align-self: flex-start;
}

@media (max-width: 768px) {
  .message {
    max-width: 85%;
  }
  
  .message-bubble {
    padding: 0.7rem 0.9rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .message {
    max-width: 90%;
    margin-bottom: 0.4rem;
  }
  
  .message-bubble {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .message-time {
    font-size: 0.65rem;
    margin-top: 0.2rem;
  }
}
</style>