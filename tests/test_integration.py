import pytest
from playwright.async_api import async_playwright
import asyncio
from datetime import datetime

class TestRealTimeFeatures:
    """Real-time collaboration tests"""
    
    @pytest.mark.asyncio
    async def test_websocket_connection(self):
        """Test WebSocket connection establishment"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            # Navigate to challenge page
            await page.goto("http://localhost:3002")
            
            # Connect to WebSocket
            ws_message = await page.evaluate("""
                () => {
                    return new Promise((resolve) => {
                        const ws = new WebSocket('ws://localhost:1234');
                        ws.onopen = () => {
                            ws.send(JSON.stringify({type: 'join_session', data: {sessionId: 'test-session', userId: 'user123'}}));
                            resolve('connected');
                        };
                        ws.onerror = (error) => {
                            resolve('error: ' + error.message);
                        };
                    });
                };
            """)
            
            assert ws_message == 'connected', "WebSocket connection failed"
            
            await browser.close()
    
    @pytest.mark.asyncio
    async def test_real_time_code_sync(self):
        """Test real-time code synchronization"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page1, page2 = await asyncio.gather(
                browser.new_page(),
                browser.new_page()
            )
            
            # Navigate both pages to same challenge
            await asyncio.gather(
                page1.goto("http://localhost:3002"),
                page2.goto("http://localhost:3002")
            )
            
            # Join session from both pages
            await asyncio.gather(
                page1.evaluate("() => { window.testSocket.send(JSON.stringify({type: 'join_session', data: {sessionId: 'test-session', userId: 'user1'}})); }"),
                page2.evaluate("() => { window.testSocket.send(JSON.stringify({type: 'join_session', data: {sessionId: 'test-session', userId: 'user2'}})); }")
            )
            
            # Wait a bit for connection
            await asyncio.sleep(1)
            
            # Send code change from page1
            code_change = await page1.evaluate("""
                () => {
                    window.testSocket.send(JSON.stringify({
                        type: 'code_change',
                        data: {sessionId: 'test-session', userId: 'user1', code: 'function test() { console.log("hello"); }', language: 'python'}
                    }));
                    return 'sent';
                };
            """)
            
            assert code_change == 'sent', "Failed to send code change"
            
            # Wait for sync on page2
            synced_code = await page2.evaluate("""
                () => {
                    return new Promise((resolve) => {
                        window.testSocket.onmessage = (event) => {
                            const data = JSON.parse(event.data);
                            if (data.type === 'code_change' && data.userId === 'user1') {
                                resolve(data.data.code);
                            }
                        };
                    });
                };
            """)
            
            assert 'function test() { console.log("hello"); }' in synced_code, "Code not synchronized"
            
            await browser.close()
    
    @pytest.mark.asyncio
    async def test_chat_functionality(self):
        """Test real-time chat functionality"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            await page.goto("http://localhost:3002")
            
            # Join session
            await page.evaluate("""
                () => {
                    window.testSocket.send(JSON.stringify({type: 'join_session', data: {sessionId: 'test-session', userId: 'chat-user'}}));
                };
            """)
            
            await asyncio.sleep(1)
            
            # Send chat message
            chat_sent = await page.evaluate("""
                () => {
                    window.testSocket.send(JSON.stringify({
                        type: 'chat_message',
                        data: {sessionId: 'test-session', userId: 'chat-user', message: 'Hello everyone!'}
                    }));
                    return 'sent';
                };
            """)
            
            assert chat_sent == 'sent', "Failed to send chat message"
            
            # Wait for message reception
            message_received = await page.evaluate("""
                () => {
                    return new Promise((resolve) => {
                        window.testSocket.onmessage = (event) => {
                            const data = JSON.parse(event.data);
                            if (data.type === 'chat_message' && data.message === 'Hello everyone!') {
                                resolve(data);
                            }
                        };
                    });
                };
            """)
            
            assert message_received['message'] == 'Hello everyone!', "Chat message not received"
            
            await browser.close()

class TestVideoStreaming:
    """Video streaming optimization tests"""
    
    @pytest.mark.asyncio
    async def test_hls_streaming(self):
        """Test HLS video streaming"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            # Navigate to a course with video
            await page.goto("http://localhost:3001")
            
            # Find and play a video
            video_element = await page.wait_for_selector('video')
            
            # Check if HLS streaming is working
            hls_working = await page.evaluate("""
                (video) => {
                    return new Promise((resolve) => {
                        video.addEventListener('loadstart', () => {
                            console.log('Video loading started');
                        });
                        
                        video.addEventListener('canplay', () => {
                            resolve(true);
                        });
                        
                        video.addEventListener('error', (e) => {
                            resolve(false);
                        });
                        
                        // Start playing
                        video.play();
                    });
                };
            """, video_element)
            
            assert hls_working, "HLS streaming not working"
            
            await browser.close()
    
    @pytest.mark.asyncio
    async def test_video_quality_adaptation(self):
        """Test video quality adaptation"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            await page.goto("http://localhost:3001")
            
            # Test different network conditions
            network_conditions = [
                {'name': 'Slow 3G', 'download_throughput': 750, 'upload_throughput': 250},
                {'name': 'Regular 4G', 'download_throughput': 1000, 'upload_throughput': 500},
                {'name': 'WiFi', 'download_throughput': 5000, 'upload_throughput': 2000}
            ]
            
            for condition in network_conditions:
                context = await browser.new_context()
                page_cdp = await context.new_page()
                
                # Set network conditions
                await page_cdp.emulate_network_conditions(condition)
                
                await page_cdp.goto("http://localhost:3001")
                
                # Test video playback under different conditions
                video_element = await page_cdp.wait_for_selector('video')
                
                playback_quality = await page_cdp.evaluate("""
                    (video) => {
                        return new Promise((resolve) => {
                            let quality = 'unknown';
                            video.addEventListener('loadstart', () => {
                                video.play();
                            });
                            
                            video.addEventListener('loadedmetadata', () => {
                                quality = video.videoHeight + 'p';
                            });
                            
                            setTimeout(() => {
                                if (video.readyState >= 3) {
                                    resolve(quality);
                                }
                            }, 5000);
                        });
                };
                    """, video_element)
                
                print(f"Network: {condition['name']}, Quality: {playback_quality}")
                
                await page_cdp.close()
                await context.close()
            
            await browser.close()

if __name__ == '__main__':
    pytest.main([__file__, "-v"])