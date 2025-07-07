import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Calendar, 
  TrendingUp,
  Clock,
  MessageSquare,
  Plus,
  Star,
  Activity,
  Phone,
  Video,
  MapPin,
  Edit3,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Bell,
  Target,
  Award,
  Zap,
  ChevronRight,
  MoreHorizontal,
  BellRing,
  UserCheck,
  Timer,
  Flame,
  TrendingDown,
  BarChart3,
  Calendar as CalendarIcon,
  Settings
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme, getColors } from '../../hooks/useColorScheme';
import { router } from 'expo-router';
import {
  getEnhancedTrainerStats,
  getEnhancedActiveClients,
  getEnhancedTodaySessions,
  getEnhancedUpcomingSessions,
  getSessionNotifications,
  getClientActivityLog,
  markSessionNotificationAsRead,
  completeEnhancedTrainingSession,
  createEnhancedTrainingSession,
  updateTrainerDashboardStats,
  logClientActivity,
  EnhancedTrainerStats,
  EnhancedClientData,
  EnhancedTrainingSession,
  SessionNotification,
  ClientActivity,
} from '@/lib/trainerQueries';

const { width } = Dimensions.get('window');

export default function TodayTrainerViewNew() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);

  // State management
  const [trainerStats, setTrainerStats] = useState<EnhancedTrainerStats | null>(null);
  const [activeClients, setActiveClients] = useState<EnhancedClientData[]>([]);
  const [todaySessions, setTodaySessions] = useState<EnhancedTrainingSession[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<EnhancedTrainingSession[]>([]);
  const [notifications, setNotifications] = useState<SessionNotification[]>([]);
  const [clientActivity, setClientActivity] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [showClientActivity, setShowClientActivity] = useState(false);
  const [selectedSession, setSelectedSession] = useState<EnhancedTrainingSession | null>(null);
  const [quickNotes, setQuickNotes] = useState('');
  const [sessionRating, setSessionRating] = useState(0);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const [stats, clients, todaySessionsData, upcomingSessionsData, notificationsData, activityData] = await Promise.all([
        getEnhancedTrainerStats(),
        getEnhancedActiveClients(),
        getEnhancedTodaySessions(),
        getEnhancedUpcomingSessions(),
        getSessionNotifications(20),
        getClientActivityLog(undefined, 10)
      ]);

      setTrainerStats(stats);
      setActiveClients(clients);
      setTodaySessions(todaySessionsData);
      setUpcomingSessions(upcomingSessionsData);
      setNotifications(notificationsData);
      setClientActivity(activityData);
    } catch (error) {
      console.error('Error loading enhanced trainer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await updateTrainerDashboardStats();
    await loadAllData();
    setRefreshing(false);
  };

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return colors.primary;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'no_show': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session_completed': return <CheckCircle size={16} color={colors.success} />;
      case 'session_cancelled': return <AlertCircle size={16} color={colors.error} />;
      case 'goal_achieved': return <Award size={16} color={colors.warning} />;
      case 'progress_updated': return <TrendingUp size={16} color={colors.primary} />;
      case 'message_sent': return <MessageSquare size={16} color={colors.info} />;
      case 'login': return <UserCheck size={16} color={colors.textSecondary} />;
      default: return <Activity size={16} color={colors.textSecondary} />;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Clock size={16} color={colors.primary} />;
      case 'confirmation': return <CheckCircle size={16} color={colors.success} />;
      case 'cancellation': return <AlertCircle size={16} color={colors.error} />;
      case 'completion': return <Award size={16} color={colors.warning} />;
      case 'no_show': return <AlertCircle size={16} color={colors.warning} />;
      default: return <Bell size={16} color={colors.textSecondary} />;
    }
  };

  const handleNotificationPress = async (notification: SessionNotification) => {
    if (!notification.read) {
      await markSessionNotificationAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Navigate to session or client based on notification
    if (notification.session_id) {
      router.push(`/session/${notification.session_id}`);
    } else if (notification.client_id) {
      router.push(`/client-detail/${notification.client_id}`);
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSession) return;

    try {
      const success = await completeEnhancedTrainingSession(selectedSession.id, {
        trainer_notes: quickNotes.trim() || undefined,
        session_rating: sessionRating || undefined,
      });

      if (success) {
        setShowQuickNotes(false);
        setQuickNotes('');
        setSessionRating(0);
        setSelectedSession(null);
        await loadAllData();
        Alert.alert('Success', 'Session completed successfully!');
      } else {
        Alert.alert('Error', 'Failed to complete session');
      }
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Error', 'Failed to complete session');
    }
  };

  const handleSessionPress = (session: EnhancedTrainingSession) => {
    console.log('handleSessionPress called with session:', session);
    console.log('Session ID:', session.id);
    router.push(`/session-details/${session.id}`);
  };

  const handleClientPress = (client: EnhancedClientData) => {
    console.log('handleClientPress called with:', client);
    if (!client || !client.id) {
      Alert.alert('Error', 'Client data is missing or invalid.');
      return;
    }
    router.push(`/client-detail/${client.id}` as any);
  };

  const handleNewSession = () => {
    router.push('/trainers/new-session');
  };

  const handleViewAllClients = () => {
    router.push('/trainers/clients');
  };

  const handleViewAllSessions = () => {
    router.push('/trainers/sessions');
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your enhanced dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Enhanced Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
            <Text style={styles.greetingText}>
              Good Morning, {trainerStats?.trainer_name?.split(' ')[0] || 'Trainer'}! 💪
            </Text>
            <Text style={styles.subGreetingText}>
              You have {trainerStats?.pending_today || 0} sessions today
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => setShowNotifications(true)}
            >
              <Bell size={20} color={colors.textSecondary} />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowClientActivity(true)}
            >
              <Activity size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Overview Card */}
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#BE185D', '#BE123C'] : ['#F093FB', '#F5576C']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.overviewContent}>
            <Text style={styles.overviewLabel}>TODAY'S PERFORMANCE</Text>
            <Text style={styles.overviewNumber}>
              {trainerStats?.completed_today || 0}/{trainerStats?.today_sessions || 0}
            </Text>
            <Text style={styles.overviewMessage}>
              {(trainerStats?.today_sessions || 0) - (trainerStats?.completed_today || 0)} sessions remaining
            </Text>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatNumber}>{trainerStats?.active_clients || 0}</Text>
                <Text style={styles.overviewStatLabel}>Active Clients</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatNumber}>
                  {trainerStats?.avg_session_rating ? trainerStats.avg_session_rating.toFixed(1) : '0.0'}
                </Text>
                <Text style={styles.overviewStatLabel}>Avg Rating</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatNumber}>{trainerStats?.weekly_sessions || 0}</Text>
                <Text style={styles.overviewStatLabel}>This Week</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.overviewButton} onPress={handleNewSession}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.overviewButtonText}>Schedule New</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Enhanced Quick Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard} onPress={handleViewAllClients}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={24} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{trainerStats?.total_clients || 0}</Text>
            <Text style={styles.statLabel}>Total Clients</Text>
            <View style={styles.statTrend}>
              <TrendingUp size={12} color={colors.success} />
              <Text style={styles.statTrendText}>+2 this week</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCard} onPress={handleViewAllSessions}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <Star size={24} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>
              {trainerStats?.avg_session_rating ? trainerStats.avg_session_rating.toFixed(1) : '0.0'}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
            <View style={styles.statTrend}>
              <TrendingUp size={12} color={colors.success} />
              <Text style={styles.statTrendText}>+0.2 this month</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/trainer/analytics')}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
              <BarChart3 size={24} color={colors.warning} />
            </View>
            <Text style={styles.statNumber}>{trainerStats?.weekly_sessions || 0}</Text>
            <Text style={styles.statLabel}>Weekly Sessions</Text>
            <View style={styles.statTrend}>
              <TrendingUp size={12} color={colors.success} />
              <Text style={styles.statTrendText}>+15% vs last week</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Sessions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Sessions</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.cardActionButton} onPress={handleNewSession}>
                <Plus size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardActionButton} onPress={handleViewAllSessions}>
                <CalendarIcon size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {todaySessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={32} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No sessions scheduled for today</Text>
              <TouchableOpacity style={styles.emptyActionButton} onPress={handleNewSession}>
                <Text style={styles.emptyActionText}>Schedule First Session</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todaySessions.map((session) => (
              <TouchableOpacity 
                key={session.id} 
                style={styles.sessionItem}
                onPress={() => handleSessionPress(session)}
              >
                <View style={styles.sessionTime}>
                  <Clock size={16} color={colors.textSecondary} />
                  <Text style={styles.sessionTimeText}>{formatTime(session.scheduled_time)}</Text>
                </View>
                
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionClient}>
                      {session.client?.full_name || 'Unknown Client'}
                    </Text>
                    <View style={[
                      styles.sessionStatusBadge,
                      { backgroundColor: getSessionStatusColor(session.status) }
                    ]}>
                      <Text style={styles.sessionStatusText}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.sessionType}>{session.type}</Text>
                  
                  <View style={styles.sessionMeta}>
                    {session.location && (
                      <View style={styles.sessionMetaItem}>
                        <MapPin size={12} color={colors.textTertiary} />
                        <Text style={styles.sessionMetaText}>{session.location}</Text>
                      </View>
                    )}
                    <View style={styles.sessionMetaItem}>
                      <Timer size={12} color={colors.textTertiary} />
                      <Text style={styles.sessionMetaText}>{session.duration_minutes} min</Text>
                    </View>
                    {session.client?.fitness_goals && session.client.fitness_goals.length > 0 && (
                      <View style={styles.sessionMetaItem}>
                        <Target size={12} color={colors.textTertiary} />
                        <Text style={styles.sessionMetaText}>{session.client.fitness_goals[0]}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.sessionActions}>
                  <TouchableOpacity 
                    style={styles.sessionActionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/chat/${session.client_id}`);
                    }}
                  >
                    <MessageSquare size={16} color={colors.primary} />
                  </TouchableOpacity>
                  
                  {session.status === 'scheduled' && (
                    <TouchableOpacity 
                      style={styles.sessionActionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                        setQuickNotes(session.trainer_notes || '');
                        setSessionRating(session.session_rating || 0);
                        setShowQuickNotes(true);
                      }}
                    >
                      <CheckCircle size={16} color={colors.success} />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Upcoming Sessions</Text>
              <Text style={styles.cardSubtitle}>Next 7 days</Text>
            </View>
            
            {upcomingSessions.slice(0, 3).map((session) => (
              <TouchableOpacity 
                key={session.id} 
                style={styles.upcomingSessionItem}
                onPress={() => handleSessionPress(session)}
              >
                <View style={styles.upcomingSessionDate}>
                  <Text style={styles.upcomingSessionDay}>
                    {new Date(session.scheduled_date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={styles.upcomingSessionDateNum}>
                    {new Date(session.scheduled_date).getDate()}
                  </Text>
                </View>
                
                <View style={styles.upcomingSessionInfo}>
                  <Text style={styles.upcomingSessionClient}>
                    {session.client?.full_name}
                  </Text>
                  <Text style={styles.upcomingSessionType}>{session.type}</Text>
                  <Text style={styles.upcomingSessionTime}>
                    {formatTime(session.scheduled_time)} • {session.duration_minutes}min
                  </Text>
                </View>
                
                <ChevronRight size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
            
            {upcomingSessions.length > 3 && (
              <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllSessions}>
                <Text style={styles.viewAllText}>
                  View All Sessions ({upcomingSessions.length})
                </Text>
                <ChevronRight size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Enhanced Active Clients */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Clients</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.cardActionButton} onPress={handleViewAllClients}>
                <Users size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {activeClients.length === 0 ? (
            <Text style={styles.emptyText}>No active clients assigned</Text>
          ) : (
            activeClients.slice(0, 4).map((client) => (
              <TouchableOpacity 
                key={client.id} 
                style={styles.clientItem}
                onPress={() => handleClientPress(client)}
              >
                <View style={styles.clientLeft}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {client.client_name?.charAt(0) || '?'}
                    </Text>
                    <View style={[
                      styles.activityIndicator,
                      { backgroundColor: client.activity_status === 'active' ? colors.success : 
                                        client.activity_status === 'inactive' ? colors.warning : colors.error }
                    ]} />
                  </View>
                  
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.full_name}</Text>
                    <Text style={styles.clientEmail}>{client.email}</Text>
                    <View style={styles.clientStats}>
                      <Text style={styles.clientStat}>
                        {client.completed_sessions}/{client.total_sessions} sessions
                      </Text>
                      {client.avg_rating > 0 && (
                        <View style={styles.ratingBadge}>
                          <Star size={10} color="#FFFFFF" />
                          <Text style={styles.ratingText}>{client.avg_rating.toFixed(1)}</Text>
                        </View>
                      )}
                      <View style={styles.progressBadge}>
                        <Text style={styles.progressText}>{client.progress_score}% progress</Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                <View style={styles.clientActions}>
                  <TouchableOpacity 
                    style={styles.clientActionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/trainers/new-session?clientId=${client.id}`);
                    }}
                  >
                    <Plus size={14} color={colors.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.clientActionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/chat/${client.id}`);
                    }}
                  >
                    <MessageSquare size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
          
          {activeClients.length > 4 && (
            <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllClients}>
              <Text style={styles.viewAllText}>
                View All Clients ({activeClients.length})
              </Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={handleNewSession}>
              <Plus size={20} color={colors.primary} />
              <Text style={styles.actionText}>New Session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleViewAllClients}>
              <Users size={20} color={colors.success} />
              <Text style={styles.actionText}>View Clients</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/trainer/messages')}>
              <MessageSquare size={20} color={colors.warning} />
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/templates')}>
              <Target size={20} color={colors.error} />
              <Text style={styles.actionText}>Templates</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleNewSession}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Enhanced Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotifications(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.notificationsList}>
            {notifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <Bell size={48} color={colors.textTertiary} />
                <Text style={styles.emptyNotificationsText}>No notifications</Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View style={styles.notificationIcon}>
                    {getNotificationIcon(notification.notification_type)}
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.created_at).toLocaleString()}
                    </Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Client Activity Modal */}
      <Modal
        visible={showClientActivity}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClientActivity(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recent Client Activity</Text>
            <TouchableOpacity onPress={() => setShowClientActivity(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.activityList}>
            {clientActivity.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Activity size={48} color={colors.textTertiary} />
                <Text style={styles.emptyActivityText}>No recent activity</Text>
              </View>
            ) : (
              clientActivity.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    {getActivityIcon(activity.activity_type)}
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(activity.activity_date).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Complete Session Modal */}
      <Modal
        visible={showQuickNotes}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuickNotes(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuickNotes(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Complete Session</Text>
            <TouchableOpacity onPress={handleCompleteSession}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {selectedSession && (
              <View style={styles.sessionSummary}>
                <Text style={styles.sessionSummaryTitle}>
                  {selectedSession.client?.full_name} - {selectedSession.type}
                </Text>
                <Text style={styles.sessionSummaryTime}>
                  {formatTime(selectedSession.scheduled_time)} • {selectedSession.duration_minutes} min
                </Text>
              </View>
            )}
            
            <Text style={styles.fieldLabel}>Session Rating</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={styles.ratingButton}
                  onPress={() => setSessionRating(rating)}
                >
                  <Star 
                    size={24} 
                    color={rating <= sessionRating ? colors.warning : colors.border}
                    fill={rating <= sessionRating ? colors.warning : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.fieldLabel}>Session Notes</Text>
            <TextInput
              style={styles.textArea}
              value={quickNotes}
              onChangeText={setQuickNotes}
              placeholder="Add notes about the session, client progress, or observations..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  greetingText: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    marginTop: 4,
  },
  subGreetingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  headerButton: {
    padding: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  overviewCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
  },
  overviewContent: {
    alignItems: 'flex-start',
  },
  overviewLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  overviewNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overviewMessage: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewStatNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  overviewStatLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  overviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  overviewButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTrendText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.success,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  cardSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  sessionTimeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionClient: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  sessionStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sessionStatusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  sessionType: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  upcomingSessionDate: {
    width: 60,
    alignItems: 'center',
    marginRight: 16,
  },
  upcomingSessionDay: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  upcomingSessionDateNum: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  upcomingSessionInfo: {
    flex: 1,
  },
  upcomingSessionClient: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  upcomingSessionType: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  upcomingSessionTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  clientAvatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  activityIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  clientEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  clientStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientStat: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  ratingText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  progressBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 9,
    color: colors.primary,
  },
  clientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  clientActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  viewAllText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyNotificationsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
  },
  unreadNotification: {
    backgroundColor: colors.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  notificationMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  activityList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyActivityText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
  },
  activityIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textTertiary,
  },
  sessionSummary: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  sessionSummaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  sessionSummaryTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  ratingButton: {
    padding: 4,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
});