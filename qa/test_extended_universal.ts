export const TEST_CASES = [
  // === KORTA INPUTS (1-2 meningar) ===
  
  // 1. Kort arg rant
  'This code is garbage. Who wrote this?',
  
  // 2. Kort teknisk status
  'Database is down. Need to restart.',
  
  // 3. Kort svengelska
  'Vi måste fixa denna buggen asap.',
  
  // 4. Kort slarvig
  'the api is broken fix it now',
  
  // 5. Kort formell request
  'Could you please review this PR when you have a moment?',
  
  // 6. Kort aggressiv
  'This is completely unacceptable. We need to fix this immediately.',
  
  // 7. Kort teknisk
  'Memory leak detected in worker process. Investigating.',
  
  // 8. Kort otydlig
  'something broke idk what happened',
  
  // === MEDEL LÅNGA INPUTS (3-5 meningar) ===
  
  // 9. Medel arg rant
  'This code is absolute garbage. Who the fck merged this? It breaks the entire auth layer. I\'m reverting this sht immediately. This is not acceptable.',
  
  // 10. Medel teknisk status
  'We are experiencing issues with the database connection pool. The pool is exhausted and requests are timing out. We need to increase the pool size or optimize the queries. This is affecting production.',
  
  // 11. Medel svengelska
  'Jag har hittat en bugg i login-flödet. När man loggar in med BankID så kraschar det ibland. Vi behöver fixa detta innan release på fredag.',
  
  // 12. Medel slarvig
  'the deployment failed again. something wrong with docker. cant figure out what. need help asap',
  
  // 13. Medel formell
  'I would like to request a code review for the authentication module. The changes include improved error handling and session management. Please let me know if you have any questions.',
  
  // 14. Medel aggressiv
  'This is completely unacceptable. The system has been down for 3 hours and we have no backup plan. We need to fix this now or we will lose customers. This is a critical issue.',
  
  // 15. Medel teknisk
  'We identified a race condition in the payment processing flow. When users double-click the purchase button, the payment is processed twice. We need to implement debouncing to prevent this issue.',
  
  // 16. Medel otydlig
  'something is wrong with the api. it works sometimes but not always. i think it might be a caching issue but im not sure. need to investigate further',
  
  // === LÅNGA INPUTS (6+ meningar) ===
  
  // 17. Lång arg rant
  'This code is absolute garbage. Who the fck merged this? It breaks the entire auth layer. I\'m reverting this sht immediately. This is not acceptable. We have been dealing with this kind of sloppy work for months now. I am tired of cleaning up after people who don\'t care about code quality. This needs to stop.',
  
  // 18. Lång teknisk status
  'We are currently experiencing significant performance degradation in our production environment. The database connection pool is exhausted, causing requests to timeout. After investigation, we found that several queries are not using indexes properly, leading to full table scans. We need to optimize these queries and potentially increase the connection pool size. Additionally, we should implement query caching to reduce database load. This is a critical issue that needs immediate attention.',
  
  // 19. Lång svengelska
  'Jag har hittat en kritisk bugg i login-flödet. När man loggar in med BankID så kraschar det ibland, speciellt när det är hög trafik. Vi har testat detta i staging och det verkar vara ett race condition-problem. Vi behöver fixa detta innan release på fredag annars kommer vi inte kunna släppa. Jag har redan börjat skriva om koden men behöver hjälp med testningen.',
  
  // 20. Lång slarvig
  'the deployment failed again. something wrong with docker. cant figure out what. need help asap. the logs dont show anything useful. i tried restarting everything but it still doesnt work. maybe its a network issue? or maybe the config file is wrong? i dont know. someone please help me figure this out before the deadline.',
  
  // 21. Lång formell
  'I would like to request a comprehensive code review for the authentication module that I have been working on. The changes include improved error handling, enhanced session management, and additional security measures. I have also updated the unit tests to cover the new functionality. Please let me know if you have any questions or concerns about the implementation. I am available for discussion if needed.',
  
  // 22. Lång aggressiv
  'This is completely unacceptable. The system has been down for 3 hours and we have no backup plan. We need to fix this now or we will lose customers. This is a critical issue that should have been prevented. I am extremely frustrated with the lack of proper monitoring and alerting. We need to implement better practices immediately to prevent this from happening again.',
  
  // 23. Lång teknisk
  'We identified a race condition in the payment processing flow. When users double-click the purchase button, the payment is processed twice, resulting in duplicate charges. After analyzing the code, we found that the debouncing mechanism is not properly implemented. We need to add proper debouncing and also implement idempotency keys to prevent duplicate processing. Additionally, we should add logging to track these events for future analysis.',
  
  // 24. Lång otydlig
  'something is wrong with the api. it works sometimes but not always. i think it might be a caching issue but im not sure. need to investigate further. the error messages are not helpful. maybe its a database problem? or maybe the server is overloaded? i dont know. someone needs to look at this.',
  
  // === EDGE CASES ===
  
  // 25. Bara svordomar
  'fck this sht. this is bs. wtf is going on.',
  
  // 26. All caps
  'THIS IS URGENT. THE SYSTEM IS DOWN. WE NEED TO FIX THIS NOW.',
  
  // 27. Mixed case
  'tHiS cOdE iS bRoKeN. wHy DiD yOu MeRgE tHiS?',
  
  // 28. Teknisk jargon utan kontext
  'race condition in the event loop causing memory leaks in the worker threads',
  
  // 29. För lång input (testar max length)
  'This is a very long input that tests how the system handles extended text. '.repeat(50) + 'We need to ensure that the system can handle long inputs without breaking.',
  
  // 30. Tom input (edge case - kommer inte testas men bra att ha)
  '',
];


