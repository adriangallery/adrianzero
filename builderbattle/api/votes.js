// Builder Battle API - Supabase Database
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Admin address
const ADMIN_ADDRESS = '0x4943407105999e3e97efa2035f5cbc64d72581c6';

// Load data from Supabase
async function loadData() {
    try {
        // Get participants
        const { data: participants, error: participantsError } = await supabase
            .from('participants')
            .select('*')
            .order('id');

        if (participantsError) {
            console.error('Error loading participants:', participantsError);
            return getDefaultData();
        }

        // Get votes
        const { data: votes, error: votesError } = await supabase
            .from('votes')
            .select('*');

        if (votesError) {
            console.error('Error loading votes:', votesError);
            return getDefaultData();
        }

        // Get winners
        const { data: winners, error: winnersError } = await supabase
            .from('winners')
            .select('*')
            .order('drawn_at', { ascending: false });

        if (winnersError) {
            console.error('Error loading winners:', winnersError);
            return getDefaultData();
        }

        // Transform votes data
        const votesMap = {};
        const voters = [];
        votes.forEach(vote => {
            votesMap[vote.voter_address] = vote.participant_id;
            voters.push(vote.voter_address);
        });

        return {
            participants: participants || [],
            votes: votesMap,
            voters: voters,
            winners: winners || [],
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
        return getDefaultData();
    }
}

// Get default data structure
function getDefaultData() {
    return {
        participants: [],
        votes: {},
        voters: [],
        winners: [],
        lastUpdated: null
    };
}

// Save data to Supabase
async function saveData(data) {
    try {
        console.log('Starting saveData with:', {
            participants: data.participants.length,
            voters: data.voters.length,
            winners: data.winners.length
        });
        
        // Update participants
        for (const participant of data.participants) {
            console.log('Saving participant:', participant.id, participant.name);
            const { error } = await supabase
                .from('participants')
                .upsert({
                    id: participant.id,
                    name: participant.name,
                    image: participant.image,
                    x_profile: participant.x_profile || '',
                    votes: participant.votes || 0,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error saving participant:', error);
                return false;
            }
        }

        // Clear existing votes
        console.log('Clearing existing votes...');
        const { error: deleteError } = await supabase
            .from('votes')
            .delete()
            .neq('id', 0); // Delete all votes

        if (deleteError) {
            console.error('Error clearing votes:', deleteError);
            return false;
        }
        console.log('Votes cleared successfully');

        // Insert new votes
        const votesToInsert = Object.entries(data.votes).map(([voterAddress, participantId]) => ({
            voter_address: voterAddress,
            participant_id: participantId,
            created_at: new Date().toISOString()
        }));

        console.log('Votes to insert:', votesToInsert.length);
        if (votesToInsert.length > 0) {
            const { error: votesError } = await supabase
                .from('votes')
                .insert(votesToInsert);

            if (votesError) {
                console.error('Error saving votes:', votesError);
                return false;
            }
            console.log('Votes saved successfully');
        }

        // Update winners (only add new ones, don't clear existing)
        console.log('Processing winners:', data.winners.length);
        for (const winner of data.winners) {
            console.log('Processing winner:', winner);
            
            // Check if this winner already exists
            const { data: existingWinner, error: checkError } = await supabase
                .from('winners')
                .select('id')
                .eq('participant_id', winner.participant_id)
                .eq('drawn_at', winner.drawn_at)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking existing winner:', checkError);
                return false;
            }

            if (!existingWinner) {
                console.log('Inserting new winner:', winner);
                const { error: winnerError } = await supabase
                    .from('winners')
                    .insert(winner);

                if (winnerError) {
                    console.error('Error saving winner:', winnerError);
                    return false;
                }
                console.log('Winner saved successfully');
            } else {
                console.log('Winner already exists, skipping');
            }
        }

        console.log('Data saved to Supabase successfully');
        return true;
    } catch (error) {
        console.error('Error saving data to Supabase:', error);
        return false;
    }
}

module.exports = async function handler(req, res) {
    try {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Load current data
        let data;
        try {
            data = await loadData();
            console.log('Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            return res.status(500).json({ error: 'Failed to load data: ' + error.message });
        }

        if (req.method === 'GET') {
            // Return all data
            return res.status(200).json({
                success: true,
                data: {
                    participants: data.participants,
                    totalVotes: data.voters.length,
                    voters: data.voters,
                    votes: data.votes,
                    lastUpdated: data.lastUpdated
                }
            });
        }

        if (req.method === 'POST') {
            console.log('POST request received, body:', req.body);
            const { action, ...payload } = req.body;
            
            console.log('API received:', { action, payload });
            
            if (action === 'vote') {
                const { address, participantId } = payload;
                
                console.log('Vote data:', { address, participantId });
                console.log('Available participants:', data.participants.map(p => ({ id: p.id, name: p.name })));
                console.log('Current voters:', data.voters);
                
                if (!address || !participantId) {
                    console.log('Missing required fields for vote:', { address: !!address, participantId: !!participantId });
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                // Check if user has already voted
                if (data.voters.includes(address)) {
                    console.log('User already voted:', address);
                    return res.status(400).json({ error: 'User has already voted' });
                }

                // Check if participant exists
                const participant = data.participants.find(p => p.id === participantId);
                if (!participant) {
                    console.log('Participant not found:', participantId);
                    return res.status(400).json({ error: 'Participant not found' });
                }

                // Record vote
                data.votes[address] = participantId;
                data.voters.push(address);
                participant.votes++;
                
                console.log('Vote recorded, participant votes:', participant.votes);

                // Save data
                if (await saveData(data)) {
                    console.log('Vote saved successfully');
                    return res.status(200).json({
                        success: true,
                        message: 'Vote recorded successfully',
                        participant: participant
                    });
                } else {
                    console.error('Failed to save vote data');
                    return res.status(500).json({ error: 'Failed to save vote' });
                }
            }

            if (action === 'addParticipant') {
                const { name, image, xProfile } = payload;
                
                console.log('Adding participant:', { name, xProfile, hasImage: !!image });
                
                if (!name || !image) {
                    console.log('Missing required fields:', { name: !!name, image: !!image });
                    return res.status(400).json({ error: 'Name and image are required' });
                }

                // Create new participant
                const nextId = data.participants.length > 0 
                    ? Math.max(...data.participants.map(p => p.id), 0) + 1
                    : 1;
                
                console.log('Next participant ID:', nextId);
                
                const newParticipant = {
                    id: nextId,
                    name: name,
                    image: image,
                    x_profile: xProfile || '',
                    votes: 0
                };

                data.participants.push(newParticipant);
                console.log('Participant added to data, total participants:', data.participants.length);

                // Save data
                if (await saveData(data)) {
                    console.log('Participant saved successfully');
                    return res.status(200).json({
                        success: true,
                        message: 'Participant added successfully',
                        participant: newParticipant
                    });
                } else {
                    console.error('Failed to save participant data');
                    return res.status(500).json({ error: 'Failed to save participant' });
                }
            }

            if (action === 'removeParticipant') {
                const { participantId } = payload;
                
                if (!participantId) {
                    return res.status(400).json({ error: 'Participant ID is required' });
                }

                // Find and remove participant
                const participantIndex = data.participants.findIndex(p => p.id === participantId);
                if (participantIndex === -1) {
                    return res.status(400).json({ error: 'Participant not found' });
                }

                const participant = data.participants[participantIndex];
                data.participants.splice(participantIndex, 1);

                // Remove votes for this participant
                Object.keys(data.votes).forEach(voter => {
                    if (data.votes[voter] === participantId) {
                        delete data.votes[voter];
                        const voterIndex = data.voters.indexOf(voter);
                        if (voterIndex > -1) {
                            data.voters.splice(voterIndex, 1);
                        }
                    }
                });

                // Save data
                if (await saveData(data)) {
                    return res.status(200).json({
                        success: true,
                        message: 'Participant removed successfully'
                    });
                } else {
                    return res.status(500).json({ error: 'Failed to save changes' });
                }
            }

            // drawWinners functionality temporarily removed
            // Will be implemented later with external lottery system

            if (action === 'backupData') {
                const { address } = payload;
                
                // Check if user is admin
                if (address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
                    return res.status(403).json({ error: 'Unauthorized' });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Data backup created',
                    data: data
                });
            }

            if (action === 'resetData') {
                const { address } = payload;
                
                // Check if user is admin
                if (address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
                    return res.status(403).json({ error: 'Unauthorized' });
                }

                // Clear all data from Supabase
                try {
                    // Clear votes
                    await supabase.from('votes').delete().neq('id', 0);
                    
                    // Clear participants
                    await supabase.from('participants').delete().neq('id', 0);
                    
                    // Clear winners
                    await supabase.from('winners').delete().neq('id', 0);
                    
                    console.log('All data cleared from Supabase');
                    
                    return res.status(200).json({
                        success: true,
                        message: 'Data reset successfully'
                    });
                } catch (error) {
                    console.error('Error clearing data:', error);
                    return res.status(500).json({ error: 'Failed to reset data' });
                }
            }

            if (action === 'getWinners') {
                return res.status(200).json({
                    success: true,
                    winners: data.winners
                });
            }

            return res.status(400).json({ error: 'Invalid action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};