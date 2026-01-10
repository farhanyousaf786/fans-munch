# Shop Selection Flow

```mermaid
flowchart TD
    A[Start Order] --> B{All items have same shopId?}
    
    B -->|Yes| C[Use that shopId]
    B -->|No| D[Get user's stand Main/Gallery]
    
    D --> E{Stand is Gallery?}
    
    E -->|Yes| F[Get section's shops]
    E -->|No| G[Get section's shops]
    
    F --> H[Check availability]
    G --> H
    
    H --> I{Is last shop available?}
    
    I -->|Yes| J[Use last shop gallery]
    I -->|No| K[Use first available shop]
    
    C --> L[Create order with selected shop]
    J --> L
    K --> L
    
    L --> M[Save order to Firestore]
    
    %% Styling for better visualization
    classDef decision fill:#f9f,stroke:#333,stroke-width:2px
    classDef process fill:#bbf,stroke:#333,stroke-width:2px
    classDef end fill:#9f9,stroke:#333,stroke-width:2px
    
    class B,D,I decision
    class C,F,G,H,J,K process
    class M end
```

## Decision Points

1. **Single Shop Check**
   - If all items have the same `shopId`, use it immediately
   - Skips all stand/section logic

2. **Stand Selection**
   - `Main Stand`: Takes first available shop
   - `Gallery Stand`: Prefers last shop if available, otherwise first available

3. **Shop Availability**
   - Must exist in Firestore
   - Must have `shopAvailability === true`

## Error Cases
- ❌ No shops in section
- ❌ No available shops
- ❌ Invalid section/stand
- ❌ Network errors

## Logging
- All decisions are logged with `[SHOP SELECTION]` prefix
- Includes shop IDs, availability status, and selection reason
