import os
import logging
# from langchain_google_genai import ChatGoogleGenerativeAI

from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain.prompts import PromptTemplate
import google.generativeai as genai

genai.configure(api_key="YOUR_API_KEY")

model = genai.GenerativeModel("gemini-pro")

def chat_with_context(prompt):
    response = model.generate_content(prompt)
    return response.text

def clear_conversation():
    # simple placeholder (you can improve later)
    return "Conversation cleared"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure the Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Store conversation chains for different tasks
conversation_chains = {}

def get_or_create_conversation_chain(task_id, context):
    """Get an existing conversation chain or create a new one for a task."""
    if task_id in conversation_chains:
        return conversation_chains[task_id]
    
    # Create a new conversation chain
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.7,
        convert_system_message_to_human=True
    )
    
    # Create a custom prompt template that includes the context
    template = f"""You are an AI assistant helping a student understand their study materials.
    Use the following lecture notes as context for the entire conversation:
    
    {context}
    
    Current conversation:
    {{history}}
    Human: {{input}}
    Assistant:"""
    
    prompt = PromptTemplate(
        input_variables=["history", "input"],
        template=template
    )
    
    # Create memory and conversation chain
    memory = ConversationBufferMemory()
    conversation = ConversationChain(
        llm=llm,
        memory=memory,
        prompt=prompt,
        verbose=True
    )
    
    # Store the conversation chain
    conversation_chains[task_id] = conversation
    return conversation

def chat_with_context(task_id, context, user_input):
    """Generate a response using the conversation chain with context."""
    try:
        logger.info(f"Generating chat response for task {task_id}")
        
        # Get or create conversation chain
        conversation = get_or_create_conversation_chain(task_id, context)
        
        # Generate response
        response = conversation.predict(input=user_input)
        
        return response
        
    except Exception as e:
        logger.error(f"Error in chat_with_context: {str(e)}", exc_info=True)
        return f"Error generating response: {str(e)}"

def clear_conversation(task_id):
    """Clear the conversation history for a specific task."""
    if task_id in conversation_chains:
        del conversation_chains[task_id]
        logger.info(f"Cleared conversation for task {task_id}") 