// DOM Elements
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const loadingAnimation = document.getElementById('loadingAnimation');
const messagesDiv = document.getElementById('messages');

// Global variables
let peerConnection = null;
let dataChannel = null;
let mediaStream = null;
let audioElement = null;

// Session configuration
const SESSION_CONFIG = {
    modalities: ['text', 'audio'],
    instructions: {
        role: 'You are a helpful AI assistant with expertise in scientific research and paper analysis.',
        context: 'You can engage in voice conversations and help users find and understand scientific papers.',
        guidelines: [
            'Always acknowledge user requests clearly',
            'When searching for papers, explain what you are looking for',
            'Provide concise but informative summaries',
            'Focus on the most relevant and recent findings',
            'Highlight key insights and potential applications'
        ],
        functionUsage: {
            getLatestArxivPapers: {
                beforeCall: 'Inform user about initiating the search',
                afterCall: 'Summarize findings and provide insights',
                presentation: 'Present papers in a clear, structured format'
            }
        }
    }
};

// Helper functions
function updateStatus(status, isConnected = false) {
    statusText.textContent = status;
    statusIndicator.className = `w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`;
}

function addMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    
    // Force a reflow to ensure the animation triggers
    messageDiv.offsetHeight;
    
    // Add show class after a small delay to trigger the animation
    requestAnimationFrame(() => {
        messageDiv.classList.add('show');
    });
    
    // Smooth scroll to the new message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    
    // Limit the number of messages to prevent memory issues
    const messages = messagesDiv.getElementsByClassName('message');
    if (messages.length > 100) {
        messagesDiv.removeChild(messages[0]);
    }
}

function showLoading(show) {
    loadingAnimation.className = show ? 'mt-4' : 'hidden mt-4';
    startButton.disabled = show;
}

// arXiv paper fetching function
async function getLatestArxivPapers(query = 'AI', maxResults = 5) {
    try {
        const response = await fetch(`http://export.arxiv.org/api/query?search_query=all:${query}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const entries = xmlDoc.getElementsByTagName('entry');
        const papers = Array.from(entries).map(entry => ({
            title: entry.getElementsByTagName('title')[0]?.textContent?.trim(),
            authors: Array.from(entry.getElementsByTagName('author')).map(author => 
                author.getElementsByTagName('name')[0]?.textContent?.trim()
            ),
            summary: entry.getElementsByTagName('summary')[0]?.textContent?.trim(),
            link: entry.getElementsByTagName('id')[0]?.textContent?.trim(),
            published: entry.getElementsByTagName('published')[0]?.textContent?.trim()
        }));
        
        return papers;
    } catch (error) {
        console.error('Error fetching arXiv papers:', error);
        throw error;
    }
}

// WebRTC implementation
async function initializeWebRTC() {
    try {
        showLoading(true);
        updateStatus('Initializing...');

        // Get ephemeral token
        const tokenResponse = await fetch('/session');
        const data = await tokenResponse.json();
        
        if (!data.client_secret?.value) {
            throw new Error('Failed to get ephemeral token');
        }

        const EPHEMERAL_KEY = data.client_secret.value;

        // Create peer connection
        peerConnection = new RTCPeerConnection();

        // Set up audio element
        audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        peerConnection.ontrack = e => audioElement.srcObject = e.streams[0];

        // Add local audio track
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        peerConnection.addTrack(mediaStream.getTracks()[0]);

        // Set up data channel
        dataChannel = peerConnection.createDataChannel('oai-events');
        dataChannel.addEventListener('message', handleDataChannelMessage);
        dataChannel.addEventListener('open', () => {
            updateStatus('Connected', true);
            stopButton.disabled = false;
            startButton.disabled = true;
            addMessage('Connection established');
            configureTools(); // Configure available tools after connection
        });

        // Create and set local description
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Connect to OpenAI Realtime API
        const baseUrl = 'https://api.openai.com/v1/realtime';
        const model = 'gpt-4o-realtime-preview-2024-12-17';
        const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: 'POST',
            body: offer.sdp,
            headers: {
                Authorization: `Bearer ${EPHEMERAL_KEY}`,
                'Content-Type': 'application/sdp'
            },
        });

        if (!sdpResponse.ok) {
            throw new Error('Failed to connect to OpenAI Realtime API');
        }

        const answer = {
            type: 'answer',
            sdp: await sdpResponse.text(),
        };
        await peerConnection.setRemoteDescription(answer);

        showLoading(false);
    } catch (error) {
        console.error('Error:', error);
        showLoading(false);
        updateStatus('Error: ' + error.message);
        addMessage(error.message, 'error');
    }
}

function configureTools() {
    const event = {
        type: 'session.update',
        session: {
            ...SESSION_CONFIG,
            tools: [
                {
                    type: 'function',
                    name: 'getLatestArxivPapers',
                    description: 'Get the latest papers from arXiv based on a search query. Always inform the user before searching and provide insights after finding papers.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Search query for papers (e.g., "AI", "machine learning")'
                            },
                            maxResults: {
                                type: 'number',
                                description: 'Maximum number of papers to return (default: 5)'
                            }
                        },
                        required: ['query']
                    }
                }
            ]
        }
    };
    dataChannel.send(JSON.stringify(event));
    
    // Send additional context update
    const contextUpdate = {
        type: 'conversation.item.create',
        item: {
            type: 'text',
            content: 'Session configured with custom instructions. Ready to assist with paper searches and analysis.'
        }
    };
    dataChannel.send(JSON.stringify(contextUpdate));
}

async function handleDataChannelMessage(event) {
    try {
        const msg = JSON.parse(event.data);
        
        // Handle function calls
        if (msg.type === 'response.function_call_arguments.done') {
            if (msg.name === 'getLatestArxivPapers') {
                const args = JSON.parse(msg.arguments);
                try {
                    const papers = await getLatestArxivPapers(args.query, args.maxResults);
                    const responseEvent = {
                        type: 'conversation.item.create',
                        item: {
                            type: 'function_call_output',
                            call_id: msg.call_id,
                            output: JSON.stringify(papers)
                        }
                    };
                    dataChannel.send(JSON.stringify(responseEvent));
                    addMessage(`Found ${papers.length} papers for query: ${args.query}`);
                } catch (error) {
                    addMessage(`Error fetching papers: ${error.message}`, 'error');
                }
            }
        } else {
            addMessage(`AI: ${msg.content || JSON.stringify(msg)}`);
        }
    } catch (error) {
        console.error('Error parsing message:', error);
        addMessage(`Error parsing message: ${error.message}`, 'error');
    }
}

function cleanup() {
    try {
        // Stop all media tracks
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => {
                track.stop();
            });
            mediaStream = null;
        }

        // Clean up audio element
        if (audioElement) {
            audioElement.srcObject = null;
            audioElement.remove();
            audioElement = null;
        }

        // Close data channel
        if (dataChannel) {
            dataChannel.close();
            dataChannel = null;
        }

        // Close peer connection
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }

        updateStatus('Disconnected');
        startButton.disabled = false;
        stopButton.disabled = true;
        addMessage('Connection closed and resources cleaned up');
    } catch (error) {
        console.error('Error during cleanup:', error);
        addMessage(`Error during cleanup: ${error.message}`, 'error');
    }
}

// Event listeners
startButton.addEventListener('click', initializeWebRTC);
stopButton.addEventListener('click', cleanup);

// Initial setup
updateStatus('Disconnected');
addMessage('Ready to start voice chat'); 