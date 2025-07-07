import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  Send, 
  MoreVertical,
  CheckCheck,
  Check,
  Clock
} from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { useLocalSearchParams, router } from 'expo-router';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  content: string;
  sender: 'trainer' | 'client';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Client {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

// Mock data for demonstration
const mockClients: { [key: string]: Client } = {
  '1': {
    id: '1',
    name: 'Sarah Johnson',
    avatar: '👩‍💼',
    status: 'online',
  },
  '2': {
    id: '2',
    name: 'Mike Chen',
    avatar: '👨‍💻',
    status: 'offline',
    lastSeen: '2 hours ago',
  },
  '3': {
    id: '3',
    name: 'Emma Wilson',
    avatar: '👩‍🎨',
    status: 'away',
    lastSeen: '30 minutes ago',
  },
  '4': {
    id: '4',
    name: 'Alex Rodriguez',
    avatar: '👨‍🎯',
    status: 'online',
  },
};

const mockMessages: { [key: string]: Message[] } = {
  '1': [
    {
      id: '1',
      content: 'Hi! I wanted to ask about tomorrow\'s session.',
      sender: 'client',
      timestamp: '2024-01-15T09:30:00Z',
      status: 'read',
    },
    {
      id: '2',
      content: 'Of course! What would you like to know?',
      sender: 'trainer',
      timestamp: '2024-01-15T09:32:00Z',
      status: 'read',
    },
    {
      id: '3',
      content: 'Can we focus more on upper body exercises? I feel like my arms need more work.',
      sender: 'client',
      timestamp: '2024-01-15T09:35:00Z',
      status: 'read',
    },
    {
      id: '4',
      content: 'Absolutely! I\'ll prepare a specialized upper body routine for you. We\'ll focus on progressive overload for your arms and shoulders.',
      sender: 'trainer',
      timestamp: '2024-01-15T09:37:00Z',
      status: 'read',
    },
    {
      id: '5',
      content: 'Perfect! Thanks for being so accommodating. See you tomorrow at 10 AM!',
      sender: 'client',
      timestamp: '2024-01-15T09:40:00Z',
      status: 'read',
    },
  ],
  '2': [
    {
      id: '1',
      content: 'Hey! Quick question about the nutrition plan.',
      sender: 'client',
      timestamp: '2024-01-15T14:20:00Z',
      status: 'read',
    },
    {
      id: '2',
      content: 'Sure, what\'s up?',
      sender: 'trainer',
      timestamp: '2024-01-15T14:22:00Z',
      status: 'delivered',
    },
  ],
  '3': [
    {
      id: '1',
      content: 'I missed today\'s session due to a work emergency. Can we reschedule?',
      sender: 'client',
      timestamp: '2024-01-15T16:45:00Z',
      status: 'sent',
    },
  ],
  '4': [
    {
      id: '1',
      content: 'Great workout today! Feeling stronger already 💪',
      sender: 'client',
      timestamp: '2024-01-15T18:30:00Z',
      status: 'read',
    },
    {
      id: '2',
      content: 'That\'s awesome to hear! Your form has really improved. Keep up the great work!',
      sender: 'trainer',
      timestamp: '2024-01-15T18:32:00Z',
      status: 'read',
    },
  ],
};

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (id) {
      const clientData = mockClients[id];
      const clientMessages = mockMessages[id] || [];
      
      setClient(clientData || null);
      setMessages(clientMessages);
    }
  }, [id]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Clock size={12} color={colors.textTertiary} />;
      case 'sent':
        return <Check size={12} color={colors.textTertiary} />;
      case 'delivered':
        return <CheckCheck size={12} color={colors.textTertiary} />;
      case 'read':
        return <CheckCheck size={12} color={colors.primary} />;
      default:
        return null;
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        sender: 'trainer',
        timestamp: new Date().toISOString(),
        status: 'sending',
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Simulate message status updates
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === message.id ? { ...msg, status: 'sent' } : msg
          )
        );
      }, 500);

      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === message.id ? { ...msg, status: 'delivered' } : msg
          )
        );
      }, 1000);

      // Simulate client typing and response (for demo)
      if (Math.random() > 0.7) {
        setTimeout(() => {
          setIsTyping(true);
        }, 2000);

        setTimeout(() => {
          setIsTyping(false);
          const responses = [
            'Thanks for the quick response!',
            'Got it, see you then!',
            'Perfect, that works for me.',
            'Sounds good! 👍',
          ];
          const response: Message = {
            id: (Date.now() + 1).toString(),
            content: responses[Math.floor(Math.random() * responses.length)],
            sender: 'client',
            timestamp: new Date().toISOString(),
            status: 'sent',
          };
          setMessages(prev => [...prev, response]);
        }, 3500);
      }
    }
  };

  const handleCall = () => {
    // Implement call functionality
    console.log('Initiating call with', client?.name);
  };

  const handleVideoCall = () => {
    // Implement video call functionality
    console.log('Initiating video call with', client?.name);
  };

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Client not found</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.clientInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{client.avatar}</Text>
              <View style={[
                styles.statusDot,
                { backgroundColor: 
                  client.status === 'online' ? colors.success : 
                  client.status === 'away' ? colors.warning : colors.textTertiary 
                }
              ]} />
            </View>
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>{client.name}</Text>
              <Text style={styles.clientStatus}>
                {client.status === 'online' ? 'Online' : 
                 client.status === 'away' ? 'Away' : 
                 `Last seen ${client.lastSeen}`}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleCall}>
            <Phone size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleVideoCall}>
            <Video size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <MoreVertical size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : undefined;
            const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
            
            return (
              <View key={message.id}>
                {showDateSeparator && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>
                      {formatDate(message.timestamp)}
                    </Text>
                  </View>
                )}
                
                <View style={[
                  styles.messageContainer,
                  message.sender === 'trainer' ? styles.sentMessage : styles.receivedMessage
                ]}>
                  <View style={[
                    styles.messageBubble,
                    message.sender === 'trainer' ? styles.sentBubble : styles.receivedBubble
                  ]}>
                    <Text style={[
                      styles.messageText,
                      message.sender === 'trainer' ? styles.sentText : styles.receivedText
                    ]}>
                      {message.content}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.messageFooter,
                    message.sender === 'trainer' ? styles.sentFooter : styles.receivedFooter
                  ]}>
                    <Text style={styles.messageTime}>
                      {formatTime(message.timestamp)}
                    </Text>
                    {message.sender === 'trainer' && (
                      <View style={styles.messageStatus}>
                        {getStatusIcon(message.status)}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
          
          {isTyping && (
            <View style={styles.typingIndicator}>
              <View style={styles.typingBubble}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.textTertiary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Send 
                size={20} 
                color={newMessage.trim() ? '#FFFFFF' : colors.textTertiary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    fontSize: 24,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  clientStatus: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textTertiary,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  sentBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  sentFooter: {
    justifyContent: 'flex-end',
  },
  receivedFooter: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  messageStatus: {
    marginLeft: 4,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textTertiary,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendButtonInactive: {
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
  },
});