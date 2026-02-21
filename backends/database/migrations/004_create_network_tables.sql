-- Network, messaging, and communication tables

-- Professional connections (network)
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Connection status
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, withdrawn
    message TEXT, -- Connection request message
    
    -- Connection metadata
    connection_strength VARCHAR(50) DEFAULT 'first_degree', -- first_degree, second_degree, etc.
    tags TEXT[], -- Connection tags (mentor, colleague, etc.)
    notes TEXT, -- Private notes about connection
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    connected_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_connection UNIQUE(requester_id, recipient_id),
    CONSTRAINT no_self_connection CHECK (requester_id != recipient_id)
);

-- Network invitations and requests
CREATE TABLE IF NOT EXISTS connection_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Invitation details
    message TEXT,
    invitation_type VARCHAR(50) DEFAULT 'connection', -- connection, collaboration, endorsement
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, cancelled
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES users(id), -- User who accepted (if different from invited_email)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messaging conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Conversation participants
    participant_ids UUID[] NOT NULL, -- Array of participant IDs
    participant_count INTEGER DEFAULT 2,
    
    -- Conversation metadata
    title VARCHAR(255),
    conversation_type VARCHAR(50) DEFAULT 'direct', -- direct, group, system
    is_archived BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    
    -- Message tracking
    last_message_id UUID,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_counts JSONB, -- Map of user_id -> unread_count
    
    -- Privacy settings
    is_encrypted BOOLEAN DEFAULT FALSE,
    retention_days INTEGER, -- Auto-delete messages after X days
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for system messages
    
    -- Message content
    content TEXT,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, file, system, voice
    attachment_urls TEXT[], -- Array of file URLs
    metadata JSONB, -- Additional message metadata
    
    -- Message status
    is_deleted BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Reply threading
    reply_to_id UUID REFERENCES messages(id), -- For threaded conversations
    thread_id UUID REFERENCES messages(id), -- Root message of thread
    
    -- Ordering
    sequence_number INTEGER, -- For ordering within conversation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message read receipts
CREATE TABLE IF NOT EXISTS message_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(message_id, user_id)
);

-- Message reactions (likes, emojis)
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL, -- like, heart, laugh, etc.
    emoji_code VARCHAR(50), -- Unicode emoji or shortcode
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(message_id, user_id, reaction_type)
);

-- Groups and communities
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Group settings
    is_private BOOLEAN DEFAULT FALSE,
    is_invite_only BOOLEAN DEFAULT FALSE,
    approval_required BOOLEAN DEFAULT FALSE,
    
    -- Group metadata
    category VARCHAR(100), -- professional, alumni, industry, etc.
    tags TEXT[],
    logo_url VARCHAR(500),
    
    -- Member limits
    max_members INTEGER DEFAULT 5000,
    member_count INTEGER DEFAULT 0,
    
    -- Admin and moderation
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_ids UUID[] DEFAULT '{}',
    moderator_ids UUID[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group memberships
CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Membership details
    role VARCHAR(50) DEFAULT 'member', -- member, moderator, admin, owner
    status VARCHAR(50) DEFAULT 'active', -- active, pending, suspended, banned
    
    -- Permissions and settings
    can_post BOOLEAN DEFAULT TRUE,
    can_invite BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    
    UNIQUE(group_id, user_id)
);

-- Endorsements and recommendations
CREATE TABLE IF NOT EXISTS endorsements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endorser_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endorsed_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Endorsement details
    skill_name VARCHAR(100) NOT NULL,
    endorsement_text TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Relationship context
    relationship_type VARCHAR(100), -- manager, colleague, client, etc.
    work_duration VARCHAR(100), -- current, past, project_based, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(endorser_id, endorsed_id, skill_name),
    CONSTRAINT no_self_endorsement CHECK (endorser_id != endorsed_id)
);

-- Indexes for connections
CREATE INDEX IF NOT EXISTS idx_connections_requester_id ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient_id ON connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_requested_at ON connections(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_connected_at ON connections(connected_at DESC);

-- Connection invitations indexes
CREATE INDEX IF NOT EXISTS idx_connection_invitations_inviter_id ON connection_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_connection_invitations_invited_email ON connection_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_connection_invitations_token ON connection_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_connection_invitations_status ON connection_invitations(status);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant_ids ON conversations USING GIN(participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);

-- Message reads indexes
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);

-- Message reactions indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Groups indexes
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_is_private ON groups(is_private);
CREATE INDEX IF NOT EXISTS idx_groups_tags ON groups USING GIN(tags);

-- Group memberships indexes
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_role ON group_memberships(role);
CREATE INDEX IF NOT EXISTS idx_group_memberships_status ON group_memberships(status);

-- Endorsements indexes
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser_id ON endorsements(endorser_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorsed_id ON endorsements(endorsed_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_skill_name ON endorsements(skill_name);
CREATE INDEX IF NOT EXISTS idx_endorsements_rating ON endorsements(rating);

-- Triggers for updated_at
CREATE TRIGGER update_connection_invitations_updated_at BEFORE UPDATE ON connection_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();