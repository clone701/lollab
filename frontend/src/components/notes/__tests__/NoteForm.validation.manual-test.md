# NoteForm Validation Manual Test

## Test Cases

### Test 1: Empty Preset Name

**Steps:**

1. Open the NoteForm component
2. Leave the preset name field empty
3. Click the "保存" button

**Expected Result:**

- Error message "プリセット名を入力してください" appears below the preset name field in red
- The input field border turns red
- The save action is not executed

### Test 2: Preset Name Too Long (>100 characters)

**Steps:**

1. Open the NoteForm component
2. Enter a preset name with more than 100 characters
3. Click the "保存" button

**Expected Result:**

- Error message "プリセット名は100文字以内で入力してください" appears below the preset name field in red
- The input field border turns red
- The save action is not executed

### Test 3: Memo Too Long (>10,000 characters)

**Steps:**

1. Open the NoteForm component
2. Enter a valid preset name
3. Enter a memo with more than 10,000 characters
4. Click the "保存" button

**Expected Result:**

- Error message "対策メモは10,000文字以内で入力してください" appears below the memo field in red
- The textarea border turns red
- The save action is not executed

### Test 4: Valid Input

**Steps:**

1. Open the NoteForm component
2. Enter a valid preset name (1-100 characters)
3. Enter a memo (0-10,000 characters)
4. Click the "保存" button

**Expected Result:**

- No error messages appear
- The onSave callback is executed
- The form proceeds to save

### Test 5: Multiple Validation Errors

**Steps:**

1. Open the NoteForm component
2. Leave the preset name empty
3. Enter a memo with more than 10,000 characters
4. Click the "保存" button

**Expected Result:**

- Both error messages appear:
  - "プリセット名を入力してください" below preset name field
  - "対策メモは10,000文字以内で入力してください" below memo field
- Both input fields have red borders
- The save action is not executed

## Implementation Details

### Validation Rules

1. **Preset Name**:
   - Required (cannot be empty or whitespace only)
   - Maximum 100 characters

2. **Strategy Memo**:
   - Optional
   - Maximum 10,000 characters

### Error Display

- Error messages are displayed below the corresponding input field
- Error messages use red text color (`text-red-600`)
- Input fields with errors have red borders (`border-red-500`)
- Error messages disappear when the user corrects the input

### Save Button Behavior

- The save button is disabled during save operation (`disabled:opacity-50 disabled:cursor-not-allowed`)
- When validation fails, the save action is prevented
- When validation succeeds, the `onSave` callback is executed
